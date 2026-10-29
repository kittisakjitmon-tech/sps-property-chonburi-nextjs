const crypto = require('node:crypto')
const axios = require('axios')
const admin = require('firebase-admin')
const functions = require('firebase-functions')

const CONVERSATIONS = 'messenger_conversations'
const FACEBOOK_SECRETS = [
  'FACEBOOK_APP_SECRET',
  'FACEBOOK_PAGE_ACCESS_TOKEN',
  'FACEBOOK_WEBHOOK_VERIFY_TOKEN',
]

function conversationId(pageId, participantId) {
  return crypto.createHash('sha256')
    .update(`facebook:${pageId}:${participantId}`)
    .digest('hex')
}

function messageId(externalId) {
  return crypto.createHash('sha256')
    .update(`facebook-message:${externalId}`)
    .digest('hex')
}

function verifyFacebookSignature(rawBody, signature, appSecret) {
  if (!signature || !signature.startsWith('sha256=') || !appSecret) return false
  const expected = `sha256=${crypto.createHmac('sha256', appSecret)
    .update(rawBody, 'utf8')
    .digest('hex')}`
  const expectedBuffer = Buffer.from(expected)
  const receivedBuffer = Buffer.from(signature)
  return expectedBuffer.length === receivedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
}

function displayName(participantId) {
  return `ผู้ใช้ Facebook · ${participantId.slice(-6)}`
}

function messagePreview(text, attachments) {
  if (text.trim()) return text.trim()
  if (attachments.some(item => item.type === 'image')) return '[รูปภาพ]'
  if (attachments.length) return '[ไฟล์แนบ]'
  return '[ข้อความ]'
}

async function storeMessengerMessage({
  pageId,
  participantId,
  externalId,
  direction,
  text,
  attachments,
  timestamp,
  sentBy,
}) {
  const db = admin.firestore()
  const id = conversationId(pageId, participantId)
  const conversationRef = db.collection(CONVERSATIONS).doc(id)
  const messageRef = conversationRef.collection('messages').doc(messageId(externalId))
  const messageTimestamp = admin.firestore.Timestamp.fromMillis(timestamp)
  const preview = messagePreview(text, attachments)

  await db.runTransaction(async transaction => {
    const existingMessage = await transaction.get(messageRef)
    if (existingMessage.exists) return

    const existingConversation = await transaction.get(conversationRef)
    const current = existingConversation.data() || {}
    const previousMessageAt = current.lastMessageAt?.toMillis?.() || 0
    const isLatest = timestamp >= previousMessageAt

    transaction.set(messageRef, {
      channel: 'facebook',
      externalId,
      direction,
      text,
      attachments,
      timestamp: messageTimestamp,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: direction === 'incoming' ? 'received' : 'sent',
      ...(sentBy ? { sentBy } : {}),
    })

    const conversationData = {
      channel: 'facebook',
      pageId,
      participantId,
      displayName: current.displayName || displayName(participantId),
      unreadCount: direction === 'incoming'
        ? (current.unreadCount || 0) + 1
        : (current.unreadCount || 0),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      ...(direction === 'incoming'
        ? { lastInboundAt: messageTimestamp }
        : { lastOutboundAt: messageTimestamp }),
    }

    if (!existingConversation.exists) {
      conversationData.createdAt = admin.firestore.FieldValue.serverTimestamp()
    }
    if (isLatest) {
      conversationData.lastMessageText = preview
      conversationData.lastMessageAt = messageTimestamp
      conversationData.lastDirection = direction
    }

    transaction.set(conversationRef, conversationData, { merge: true })
  })

  return { conversationId: id, messageId: messageRef.id }
}

async function sendFacebookTextMessage(pageId, recipientId, text) {
  const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN
  if (!accessToken) throw new Error('ยังไม่ได้ตั้งค่า FACEBOOK_PAGE_ACCESS_TOKEN')

  const graphVersion = process.env.FACEBOOK_GRAPH_API_VERSION || 'v24.0'
  const url = `https://graph.facebook.com/${graphVersion}/${pageId}/messages`
  const response = await axios.post(url, {
    messaging_type: 'RESPONSE',
    recipient: { id: recipientId },
    message: { text },
  }, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    timeout: 15000,
  })

  if (!response.data?.message_id) throw new Error('Facebook ไม่ยอมรับข้อความที่ส่ง')
  return response.data
}

const facebookWebhook = functions
  .runWith({ timeoutSeconds: 60, memory: '256MB', secrets: FACEBOOK_SECRETS })
  .https.onRequest(async (req, res) => {
    if (req.method === 'GET') {
      const verifyToken = process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN
      if (!verifyToken) return res.status(503).json({ error: 'Verify token is not configured' })

      const valid = req.query['hub.mode'] === 'subscribe' &&
        req.query['hub.verify_token'] === verifyToken &&
        req.query['hub.challenge']
      return valid
        ? res.status(200).send(req.query['hub.challenge'])
        : res.status(403).json({ error: 'Webhook verification failed' })
    }

    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    const appSecret = process.env.FACEBOOK_APP_SECRET
    if (!appSecret) return res.status(503).json({ error: 'App secret is not configured' })

    const rawBody = req.rawBody
      ? req.rawBody.toString('utf8')
      : JSON.stringify(req.body || {})
    const signature = req.get('x-hub-signature-256')
    if (!verifyFacebookSignature(rawBody, signature, appSecret)) {
      return res.status(401).json({ error: 'Invalid signature' })
    }

    const body = req.body || {}
    if (body.object !== 'page') return res.status(200).json({ received: true })

    try {
      for (const entry of body.entry || []) {
        const pageId = entry.id
        if (!pageId) continue

        for (const event of entry.messaging || []) {
          const message = event.message
          const senderId = event.sender?.id
          const recipientId = event.recipient?.id
          if (!message?.mid || !senderId || !recipientId) continue

          const isEcho = message.is_echo === true
          const attachments = (message.attachments || []).map(item => ({
            type: item.type || 'file',
            ...(item.payload?.url ? { url: item.payload.url } : {}),
          }))

          await storeMessengerMessage({
            pageId,
            participantId: isEcho ? recipientId : senderId,
            externalId: message.mid,
            direction: isEcho ? 'outgoing' : 'incoming',
            text: message.text || '',
            attachments,
            timestamp: event.timestamp || Date.now(),
          })
        }
      }
      return res.status(200).json({ received: true })
    } catch (error) {
      functions.logger.error('Facebook webhook processing failed', error)
      return res.status(500).json({ error: 'Unable to process webhook' })
    }
  })

const ALLOWED_ORIGINS = new Set([
  'https://sps-property.web.app',
  'https://sps-property.firebaseapp.com',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
])

function setAdminCors(req, res) {
  const origin = req.get('origin')
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.set('Access-Control-Allow-Origin', origin)
  }
  res.set('Vary', 'Origin')
  res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type')
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
}

async function requireAdmin(req) {
  const authorization = req.get('authorization') || ''
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : ''
  if (!token) {
    const error = new Error('กรุณาเข้าสู่ระบบผู้ดูแล')
    error.status = 401
    throw error
  }

  let decoded
  try {
    decoded = await admin.auth().verifyIdToken(token)
  } catch {
    const error = new Error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่')
    error.status = 401
    throw error
  }

  const userSnapshot = await admin.firestore().collection('users').doc(decoded.uid).get()
  const role = userSnapshot.data()?.role
  if (role !== 'admin' && role !== 'super_admin') {
    const error = new Error('บัญชีนี้ไม่มีสิทธิ์จัดการข้อความ')
    error.status = 403
    throw error
  }
  return decoded
}

const facebookMessengerAdmin = functions
  .runWith({ timeoutSeconds: 30, memory: '256MB', secrets: FACEBOOK_SECRETS })
  .https.onRequest(async (req, res) => {
    setAdminCors(req, res)
    if (req.method === 'OPTIONS') return res.status(204).send('')
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    try {
      const adminUser = await requireAdmin(req)
      const { action, conversationId: id, text: rawText } = req.body || {}
      if (!id || typeof id !== 'string') return res.status(400).json({ error: 'ไม่พบรหัสห้องสนทนา' })

      const conversationRef = admin.firestore().collection(CONVERSATIONS).doc(id)
      const conversation = await conversationRef.get()
      if (!conversation.exists) return res.status(404).json({ error: 'ไม่พบห้องสนทนา' })

      if (action === 'read') {
        await conversationRef.set({ unreadCount: 0 }, { merge: true })
        return res.status(200).json({ success: true })
      }

      if (action !== 'reply') return res.status(400).json({ error: 'คำสั่งไม่ถูกต้อง' })
      const text = typeof rawText === 'string' ? rawText.trim() : ''
      if (!text) return res.status(400).json({ error: 'กรุณาพิมพ์ข้อความ' })
      if (text.length > 2000) return res.status(400).json({ error: 'ข้อความต้องไม่เกิน 2,000 ตัวอักษร' })

      const data = conversation.data()
      const result = await sendFacebookTextMessage(data.pageId, data.participantId, text)
      await storeMessengerMessage({
        pageId: data.pageId,
        participantId: data.participantId,
        externalId: result.message_id,
        direction: 'outgoing',
        text,
        attachments: [],
        timestamp: Date.now(),
        sentBy: adminUser.uid,
      })
      return res.status(201).json({ success: true })
    } catch (error) {
      const status = error.status || (error.response ? 502 : 500)
      const facebookMessage = error.response?.data?.error?.message
      const message = facebookMessage
        ? `ส่งข้อความไป Facebook ไม่สำเร็จ: ${facebookMessage}`
        : (error.status ? error.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง')
      functions.logger.error('Facebook Messenger admin request failed', {
        status,
        message: error.message,
      })
      return res.status(status).json({ error: message })
    }
  })

module.exports = {
  facebookWebhook,
  facebookMessengerAdmin,
  _private: {
    conversationId,
    messageId,
    verifyFacebookSignature,
    messagePreview,
  },
}
