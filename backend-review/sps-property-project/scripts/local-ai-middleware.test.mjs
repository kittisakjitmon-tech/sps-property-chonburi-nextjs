import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Readable } from 'node:stream'
import { createLocalAiMiddleware } from './local-ai-middleware.mjs'

const env = { VITE_FIREBASE_API_KEY: 'public-key', VITE_FIREBASE_PROJECT_ID: 'test-project', OPENROUTER_API_KEY: 'server-key' }
const freeModel = {
  id: 'test/free-vision:free', name: 'Free vision', pricing: { prompt: '0', completion: '0', request: '0', image: '0' },
  architecture: { input_modalities: ['text', 'image'], output_modalities: ['text'] },
  supported_parameters: ['response_format'], context_length: 128000,
}
const reply = (body, ok = true, status = ok ? 200 : 400) => ({ ok, status, json: async () => body })

function provider({ role = 'admin', completion = true } = {}) {
  const calls = []
  const fetcher = async (url, options = {}) => {
    calls.push({ url, options })
    if (url.startsWith('https://identitytoolkit.googleapis.com/')) return reply({ users: [{ localId: 'user-1' }] })
    if (url.startsWith('https://firestore.googleapis.com/')) return reply({ fields: { role: { stringValue: role }, status: { stringValue: 'active' } } })
    if (url === 'https://openrouter.ai/api/v1/models') return reply({ data: [freeModel] })
    if (url === 'https://openrouter.ai/api/v1/chat/completions' && completion) return reply({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({ reply: 'เตรียมร่างแล้ว', properties: [], questions: [] }) } }] })
    return reply({ error: 'unexpected' }, false, 500)
  }
  return { fetcher, calls }
}

async function invoke(middleware, { payload = { action: 'status' }, token = 'token', method = 'POST' } = {}) {
  const req = Readable.from([Buffer.from(JSON.stringify(payload))])
  req.method = method
  req.headers = token ? { authorization: `Bearer ${token}`, 'content-type': 'application/json' } : {}
  const res = {
    statusCode: 200,
    headers: {},
    setHeader(name, value) { this.headers[name] = value },
    end(body) { this.body = body },
  }
  await middleware(req, res)
  return { status: res.statusCode, body: JSON.parse(res.body), headers: res.headers }
}

test('local AI rejects an anonymous request before contacting providers', async () => {
  const { fetcher, calls } = provider()
  const result = await invoke(createLocalAiMiddleware({ env, fetcher }), { token: '' })
  assert.equal(result.status, 401)
  assert.equal(result.body.error.code, 'unauthenticated')
  assert.equal(calls.length, 0)
})

test('local AI retains role checks and rejects members', async () => {
  const { fetcher } = provider({ role: 'member' })
  const result = await invoke(createLocalAiMiddleware({ env, fetcher }))
  assert.equal(result.status, 403)
  assert.equal(result.body.error.code, 'permission-denied')
})

test('local AI checks session and role with the user token, then reports free-model status', async () => {
  const { fetcher, calls } = provider()
  const result = await invoke(createLocalAiMiddleware({ env, fetcher }))
  assert.equal(result.status, 200)
  assert.equal(result.body.configured, true)
  assert.equal(result.body.available, true)
  assert.equal(result.body.model, 'test/free-vision:free')
  assert.equal(result.body.candidates, undefined)
  const roleCall = calls.find(call => call.url.startsWith('https://firestore.googleapis.com/'))
  assert.equal(roleCall.options.headers.Authorization, 'Bearer token')
  assert.ok(!calls.some(call => call.url.includes('chat/completions')))
})

test('local AI completes a draft using only a free model and applies the cooldown', async () => {
  const { fetcher, calls } = provider()
  const middleware = createLocalAiMiddleware({ env, fetcher, now: () => 1000000 })
  const payload = { message: 'เตรียมร่างจากข้อความนี้', files: [], history: [], properties: [] }
  const result = await invoke(middleware, { payload })
  assert.equal(result.status, 200)
  assert.equal(result.body.reply, 'เตรียมร่างแล้ว')
  assert.equal(result.body.model, 'test/free-vision:free')
  const completion = calls.find(call => call.url.includes('chat/completions'))
  const request = JSON.parse(completion.options.body)
  assert.equal(request.model, 'test/free-vision:free')
  assert.equal(request.provider.max_price.prompt, 0)
  assert.equal(request.provider.allow_fallbacks, false)
  const second = await invoke(middleware, { payload })
  assert.equal(second.status, 429)
  assert.equal(second.body.error.code, 'resource-exhausted')
})

test('local AI reports a missing OpenRouter key without exposing configuration values', async () => {
  const { fetcher } = provider()
  const result = await invoke(createLocalAiMiddleware({ env: { ...env, OPENROUTER_API_KEY: '' }, fetcher }), {
    payload: { message: 'ทดสอบ', files: [], history: [], properties: [] },
  })
  assert.equal(result.status, 412)
  assert.equal(result.body.error.code, 'failed-precondition')
  assert.ok(!JSON.stringify(result.body).includes('server-key'))
})

test('local AI distinguishes a Firebase network failure from a quota failure', async () => {
  const fetcher = async () => { throw new TypeError('fetch failed') }
  const result = await invoke(createLocalAiMiddleware({ env, fetcher }))
  assert.equal(result.status, 503)
  assert.equal(result.body.error.code, 'unavailable')
  assert.match(result.body.error.message, /Firebase Authentication/)
  assert.doesNotMatch(result.body.error.message, /โควตา/)
})

test('local AI distinguishes an OpenRouter network failure from a quota failure', async () => {
  const { fetcher: base } = provider()
  const fetcher = async (url, options) => {
    if (url === 'https://openrouter.ai/api/v1/models') throw new TypeError('fetch failed')
    return base(url, options)
  }
  const result = await invoke(createLocalAiMiddleware({ env, fetcher }))
  assert.equal(result.status, 503)
  assert.equal(result.body.error.code, 'unavailable')
  assert.match(result.body.error.message, /OpenRouter/)
  assert.doesNotMatch(result.body.error.message, /โควตา/)
})

test('local AI reports malformed provider JSON separately', async () => {
  const fetcher = async () => ({ ok: true, status: 200, json: async () => { throw new SyntaxError('invalid json') } })
  const result = await invoke(createLocalAiMiddleware({ env, fetcher }))
  assert.equal(result.status, 502)
  assert.equal(result.body.error.code, 'data-loss')
  assert.match(result.body.error.message, /อ่านไม่ได้/)
})
