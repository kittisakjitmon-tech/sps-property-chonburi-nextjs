const { spawn } = require('node:child_process')
const { once } = require('node:events')
const { rmSync, statSync } = require('node:fs')
const { resolve } = require('node:path')

const root = resolve(__dirname, 'sps-property-project')
const profile = resolve(__dirname, 'chrome-smoke-profile')
const screenshot = resolve(__dirname, 'admin-login-smoke.png')
const server = spawn(process.execPath, ['scripts/dev-local.mjs', '--host', '127.0.0.1', '--port', '7100'], {
  cwd: root,
  stdio: ['ignore', 'pipe', 'pipe'],
})
let serverLog = ''
const collect = chunk => { serverLog = (serverLog + chunk.toString()).slice(-5000) }
server.stdout.on('data', collect)
server.stderr.on('data', collect)

async function stopServer() {
  if (server.exitCode !== null || server.signalCode !== null) return
  server.kill('SIGTERM')
  await Promise.race([
    once(server, 'exit'),
    new Promise(resolve => setTimeout(() => { server.kill('SIGKILL'); resolve() }, 8000)),
  ])
}

async function waitUntilReady() {
  const deadline = Date.now() + 60000
  while (!serverLog.includes('Local:')) {
    if (server.exitCode !== null || server.signalCode !== null) throw new Error(`เซิร์ฟเวอร์หยุดก่อนพร้อม (${server.exitCode || server.signalCode})`)
    if (Date.now() > deadline) throw new Error('รอเซิร์ฟเวอร์ไม่ทัน')
    await new Promise(resolve => setTimeout(resolve, 250))
  }
}

async function runChrome() {
  rmSync(profile, { recursive: true, force: true })
  const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    `--user-data-dir=${profile}`, '--window-size=1440,1000', `--screenshot=${screenshot}`,
    '--virtual-time-budget=6000', '--dump-dom', 'http://127.0.0.1:7100/login',
  ])
  let dom = ''
  let errors = ''
  chrome.stdout.on('data', chunk => { dom += chunk.toString() })
  chrome.stderr.on('data', chunk => { errors = (errors + chunk.toString()).slice(-1500) })
  const [code] = await once(chrome, 'exit')
  let screenshotBytes = 0
  try { screenshotBytes = statSync(screenshot).size } catch {}
  return {
    chromeExit: code,
    loginHeading: dom.includes('เข้าสู่ระบบแอดมิน'),
    emailField: /type="email"/.test(dom),
    passwordField: /type="password"/.test(dom),
    screenshotBytes,
    chromeLog: errors.slice(-500),
  }
}

async function main() {
  try {
    await waitUntilReady()
    const apiResponse = await fetch('http://127.0.0.1:7100/api/ai-property', {
      method: 'POST',
      headers: { Authorization: 'Bearer invalid-test-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'status' }),
    })
    const apiBody = await apiResponse.json()
    const result = { ...await runChrome(), aiRouteStatus: apiResponse.status, aiRouteCode: apiBody?.error?.code, aiRouteMessage: apiBody?.error?.message }
    console.log(JSON.stringify(result, null, 2))
    if (result.chromeExit !== 0 || !result.loginHeading || !result.emailField || !result.passwordField || result.aiRouteStatus !== 401 || result.aiRouteCode !== 'unauthenticated') process.exitCode = 1
  } catch (error) {
    console.error(JSON.stringify({ error: error.message, serverLog: serverLog.slice(-2000) }))
    process.exitCode = 1
  } finally {
    await stopServer()
    rmSync(profile, { recursive: true, force: true })
  }
}

main()
