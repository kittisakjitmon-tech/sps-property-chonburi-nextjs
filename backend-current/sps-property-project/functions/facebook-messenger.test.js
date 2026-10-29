const test = require('node:test')
const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const { facebookWebhook, _private } = require('./facebook-messenger')

test('verifyFacebookSignature accepts a valid Meta signature', () => {
  const body = JSON.stringify({ object: 'page', entry: [] })
  const signature = `sha256=${crypto.createHmac('sha256', 'secret').update(body).digest('hex')}`
  assert.equal(_private.verifyFacebookSignature(body, signature, 'secret'), true)
})

test('verifyFacebookSignature rejects invalid signatures and missing secrets', () => {
  assert.equal(_private.verifyFacebookSignature('{}', 'sha256=invalid', 'secret'), false)
  assert.equal(_private.verifyFacebookSignature('{}', null, 'secret'), false)
  assert.equal(_private.verifyFacebookSignature('{}', 'sha256=abc', ''), false)
})

test('conversation and message IDs are deterministic and isolated', () => {
  assert.equal(_private.conversationId('page', 'user'), _private.conversationId('page', 'user'))
  assert.notEqual(_private.conversationId('page', 'user'), _private.conversationId('page', 'other'))
  assert.equal(_private.messageId('mid.123').length, 64)
})

test('messagePreview describes attachments when text is empty', () => {
  assert.equal(_private.messagePreview('', [{ type: 'image' }]), '[รูปภาพ]')
  assert.equal(_private.messagePreview('', [{ type: 'file' }]), '[ไฟล์แนบ]')
  assert.equal(_private.messagePreview('สวัสดี', []), 'สวัสดี')
})

function mockResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code
      return this
    },
    json(payload) {
      this.body = payload
      return this
    },
    send(payload) {
      this.body = payload
      return this
    },
  }
}

test('facebookWebhook verifies Meta callback URLs', async () => {
  process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN = 'verify-token'
  const req = {
    method: 'GET',
    query: {
      'hub.mode': 'subscribe',
      'hub.verify_token': 'verify-token',
      'hub.challenge': 'challenge-ok',
    },
  }
  const res = mockResponse()
  await facebookWebhook(req, res)
  assert.equal(res.statusCode, 200)
  assert.equal(res.body, 'challenge-ok')
})

test('facebookWebhook accepts a correctly signed empty page event', async () => {
  process.env.FACEBOOK_APP_SECRET = 'secret'
  const body = { object: 'page', entry: [] }
  const rawBody = JSON.stringify(body)
  const signature = `sha256=${crypto.createHmac('sha256', 'secret').update(rawBody).digest('hex')}`
  const req = {
    method: 'POST',
    body,
    rawBody: Buffer.from(rawBody),
    get: name => name === 'x-hub-signature-256' ? signature : undefined,
  }
  const res = mockResponse()
  await facebookWebhook(req, res)
  assert.equal(res.statusCode, 200)
  assert.deepEqual(res.body, { received: true })
})
