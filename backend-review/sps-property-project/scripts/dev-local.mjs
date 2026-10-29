import { spawn } from 'node:child_process'
import { resolve } from 'node:path'
import process from 'node:process'

const root = process.cwd()
try {
  process.loadEnvFile(resolve(root, 'functions/.secret.local'))
} catch (error) {
  if (error.code === 'ENOENT') console.warn('ไม่พบ functions/.secret.local — บริการ AI จะแจ้งว่ายังไม่ได้ตั้งค่าคีย์')
  else throw error
}

const forwarded = process.argv.slice(2)
const hasOption = name => forwarded.some(arg => arg === name || arg.startsWith(`${name}=`) || (name === '--port' && arg === '-p'))
const viteArgs = [
  ...(hasOption('--host') ? [] : ['--host', '127.0.0.1']),
  ...(hasOption('--port') ? [] : ['--port', '7100']),
  '--strictPort',
  ...forwarded,
]

const child = spawn(process.execPath, ['node_modules/vite/bin/vite.js', ...viteArgs], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
})
let stopping = false

function stop(exitCode = 0) {
  if (stopping) return
  stopping = true
  process.exitCode = exitCode
  if (child.exitCode === null && child.signalCode === null) child.kill('SIGTERM')
  const force = setTimeout(() => {
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL')
  }, 5000)
  force.unref()
}

child.on('error', error => {
  console.error(`เปิดหลังบ้านไม่สำเร็จ: ${error.message}`)
  stop(1)
})
child.on('exit', code => {
  if (!stopping) process.exitCode = code || 0
})
process.on('SIGINT', () => stop(0))
process.on('SIGTERM', () => stop(0))

console.log('กำลังเปิด SPS Admin และบริการ AI สำหรับใช้ในเครื่องเท่านั้น…')
