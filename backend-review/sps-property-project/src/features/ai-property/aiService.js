import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions'
import { adminApp, adminAuth } from '../../lib/firebase'

const useLocalApi = import.meta.env.DEV && import.meta.env.VITE_USE_LOCAL_AI_API === 'true'
let call
if (!useLocalApi) {
  const functions = getFunctions(adminApp, 'us-central1')
  if (import.meta.env.DEV && import.meta.env.VITE_USE_AI_EMULATOR === 'true') connectFunctionsEmulator(functions, '127.0.0.1', 5001)
  call = httpsCallable(functions, 'aiPropertyAssistant', { timeout: 180000 })
}

async function requestLocal(payload) {
  const user = adminAuth.currentUser
  if (!user) throw new Error('กรุณาเข้าสู่ระบบก่อนใช้ AI')
  const idToken = await user.getIdToken()
  let response
  try {
    response = await fetch('/api/ai-property', {
      method: 'POST',
      headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(180000),
    })
  } catch {
    throw new Error('ติดต่อบริการ AI ในเครื่องไม่ได้ กรุณาปิดและรัน npm run dev ใหม่ แล้วโหลดหน้านี้อีกครั้ง')
  }
  const body = await response.json().catch(() => null)
  if (!response.ok) throw new Error(body?.error?.message || `บริการ AI ตอบผิดพลาด (${response.status})`)
  return body
}

export async function requestAssistant(payload) {
  try {
    if (useLocalApi) return await requestLocal(payload)
    return (await call(payload)).data
  } catch (err) {
    if (!useLocalApi && ['functions/not-found', 'functions/internal', 'functions/unavailable'].includes(err.code)) {
      throw new Error('ยังติดต่อบริการ AI ไม่ได้ ผู้ดูแลต้องตั้งค่า OpenRouter และติดตั้งบริการ AI ก่อน หากตั้งค่าแล้วกรุณาลองใหม่')
    }
    throw new Error(err.message || 'ติดต่อ AI ไม่สำเร็จ กรุณาลองใหม่')
  }
}
