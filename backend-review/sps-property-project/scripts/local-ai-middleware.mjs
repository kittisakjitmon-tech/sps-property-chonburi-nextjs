import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { IntakeError, validateInput, freeModelCandidates } = require('../functions/ai-property-core.cjs')
const { _test } = require('../functions/ai-property.js')
const { runFreeCompletion } = _test

const MAX_BODY_BYTES = 9 * 1024 * 1024
const ALLOWED_ROLES = ['super_admin', 'admin', 'agent']
const BLOCKED_STATUSES = ['disabled', 'suspended', 'inactive', 'pending', 'blocked']
const STATUS_BY_CODE = {
  unauthenticated: 401,
  'permission-denied': 403,
  'invalid-argument': 400,
  'failed-precondition': 412,
  'resource-exhausted': 429,
  unavailable: 503,
  'data-loss': 502,
}

async function readJson(req) {
  if (Number(req.headers['content-length']) > MAX_BODY_BYTES) throw new IntakeError('invalid-argument', 'ข้อมูลที่ส่งมีขนาดเกิน 9 MB')
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > MAX_BODY_BYTES) throw new IntakeError('invalid-argument', 'ข้อมูลที่ส่งมีขนาดเกิน 9 MB')
    chunks.push(chunk)
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')) } catch { throw new IntakeError('invalid-argument', 'ข้อมูลคำขอไม่ถูกต้อง') }
}

function sendJson(res, status, value) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.end(JSON.stringify(value))
}

function firestoreValue(fields, name) {
  const field = fields?.[name]
  return field?.stringValue ?? field?.booleanValue ?? null
}

export function createLocalAiMiddleware({ env, fetcher = fetch, now = () => Date.now() }) {
  const limits = new Map()
  let catalogCache

  async function requestJson(url, options, failureMessage) {
    let response
    try { response = await fetcher(url, options) } catch { throw new IntakeError('unavailable', failureMessage) }
    if (!response.ok) return { response, body: null }
    try { return { response, body: await response.json() } } catch { throw new IntakeError('data-loss', 'บริการภายนอกส่งคำตอบที่อ่านไม่ได้ กรุณาลองใหม่ ร่างเดิมยังอยู่') }
  }

  async function verifyUser(req) {
    const token = /^Bearer (.+)$/.exec(req.headers.authorization || '')?.[1]
    if (!token) throw new IntakeError('unauthenticated', 'กรุณาเข้าสู่ระบบก่อนใช้ AI')
    if (!env.VITE_FIREBASE_API_KEY || !env.VITE_FIREBASE_PROJECT_ID) throw new IntakeError('failed-precondition', 'การตั้งค่า Firebase สำหรับ localhost ไม่ครบ')

    const { response: authResponse, body: authBody } = await requestJson(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(env.VITE_FIREBASE_API_KEY)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: token }), signal: AbortSignal.timeout(15000),
    }, 'ติดต่อ Firebase Authentication ไม่สำเร็จ กรุณาตรวจอินเทอร์เน็ตแล้วลองใหม่')
    if (!authResponse.ok) throw new IntakeError('unauthenticated', 'Firebase ไม่ยอมรับเซสซันนี้ กรุณาออกจากระบบแล้วเข้าสู่ระบบใหม่')
    const uid = authBody?.users?.[0]?.localId
    if (!uid) throw new IntakeError('unauthenticated', 'ไม่พบบัญชี Firebase ของเซสซันนี้')

    const { response: userResponse, body: userBody } = await requestJson(`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(env.VITE_FIREBASE_PROJECT_ID)}/databases/(default)/documents/users/${encodeURIComponent(uid)}`, {
      headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15000),
    }, 'ติดต่อข้อมูลสิทธิ์ Firebase ไม่สำเร็จ กรุณาตรวจอินเทอร์เน็ตแล้วลองใหม่')
    if (!userResponse.ok) throw new IntakeError('permission-denied', 'อ่านสิทธิ์บัญชีจาก Firebase ไม่สำเร็จ กรุณาตรวจสิทธิ์ของบัญชีนี้')
    const role = firestoreValue(userBody?.fields, 'role')
    const status = firestoreValue(userBody?.fields, 'status')
    const disabled = firestoreValue(userBody?.fields, 'disabled')
    if (!ALLOWED_ROLES.includes(role) || BLOCKED_STATUSES.includes(status) || disabled === true) throw new IntakeError('permission-denied', 'บัญชีนี้ไม่มีสิทธิ์ใช้ผู้ช่วยกรอกทรัพย์')
    return uid
  }

  async function availability() {
    if (catalogCache && now() - catalogCache.at < 60000) return catalogCache.value
    const { response, body } = await requestJson('https://openrouter.ai/api/v1/models', { signal: AbortSignal.timeout(15000) }, 'ติดต่อ OpenRouter ไม่สำเร็จ กรุณาตรวจอินเทอร์เน็ตแล้วลองใหม่')
    if (!response.ok) throw new IntakeError('unavailable', 'ตรวจสอบรุ่นฟรีกับ OpenRouter ไม่สำเร็จ กรุณาลองใหม่')
    if (!Array.isArray(body.data)) throw new IntakeError('unavailable', 'ตรวจสอบรายการโมเดลไม่สำเร็จ')
    const candidates = freeModelCandidates(body.data)
    const value = {
      available: candidates.length > 0,
      model: candidates[0]?.id || null,
      candidates: candidates.map(model => model.id),
      reason: candidates.length ? `พบโมเดลฟรี ${candidates[0].name || candidates[0].id} · สลับเฉพาะรุ่นฟรีเมื่อใช้ไม่ได้` : 'ยังไม่มีโมเดลฟรีที่รองรับ ระบบจะไม่ใช้รุ่นเสียเงิน',
    }
    catalogCache = { at: now(), value }
    return value
  }

  function rateLimit(uid) {
    const timestamp = now()
    const day = new Date(timestamp).toISOString().slice(0, 10)
    const previous = limits.get(uid) || {}
    const count = previous.day === day ? previous.count || 0 : 0
    if (timestamp - (previous.lastAt || 0) < 10000 || count >= 30) throw new IntakeError('resource-exhausted', count >= 30 ? 'ครบโควตา 30 ข้อความต่อวันแล้ว กรุณาลองวันถัดไป' : 'กรุณาเว้น 10 วินาทีก่อนส่งข้อความถัดไป')
    limits.set(uid, { day, count: count + 1, lastAt: timestamp })
  }

  return async function localAiMiddleware(req, res) {
    try {
      if (req.method !== 'POST') { sendJson(res, 405, { error: { code: 'invalid-argument', message: 'ใช้ POST สำหรับบริการนี้' } }); return }
      const uid = await verifyUser(req)
      const data = await readJson(req)
      const key = env.OPENROUTER_API_KEY
      if (data?.action === 'status') {
        const { candidates: _candidates, ...status } = await availability()
        sendJson(res, 200, { configured: Boolean(key), ...status })
        return
      }
      const input = validateInput(data)
      if (!key) throw new IntakeError('failed-precondition', 'ยังไม่ได้ตั้งค่า OpenRouter API Key ที่เซิร์ฟเวอร์')
      const status = await availability()
      if (!status.available) throw new IntakeError('failed-precondition', status.reason)
      rateLimit(uid)
      sendJson(res, 200, await runFreeCompletion(input, status.candidates, key, fetcher))
    } catch (error) {
      const malformed = error instanceof SyntaxError
      const known = error instanceof IntakeError || malformed
      const code = malformed ? 'data-loss' : known ? error.code : 'unavailable'
      if (!known) {
        const secrets = [env.OPENROUTER_API_KEY, env.VITE_FIREBASE_API_KEY, req.headers.authorization].filter(value => typeof value === 'string' && value.length > 3)
        const detail = secrets.reduce((text, secret) => text.replaceAll(secret, '[hidden]'), String(error?.message || 'unknown')).slice(0, 300)
        console.error(`Local AI request failed: ${error?.name || 'Error'}: ${detail}`)
      }
      const message = malformed ? 'บริการ AI ส่งคำตอบที่อ่านไม่ได้ กรุณาลองใหม่ ร่างเดิมยังอยู่' : known ? error.message : 'ติดต่อผู้ช่วย AI ไม่สำเร็จ กรุณาลองใหม่ ข้อมูลร่างเดิมยังอยู่'
      sendJson(res, STATUS_BY_CODE[code] || 500, { error: { code, message } })
    }
  }
}
