import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  collection,
  limit,
  limitToLast,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore'
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  MessageCircle,
  MessageSquare,
  Paperclip,
  Search,
  Send,
} from 'lucide-react'
import { adminDb } from '../lib/firebase'
import { useAdminAuth } from '../context/AdminAuthContext'

const API_URL = import.meta.env.VITE_FACEBOOK_MESSENGER_API_URL || '/api/admin/messenger'

function formatTime(timestamp) {
  if (!timestamp?.toDate) return ''
  return new Intl.DateTimeFormat('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(timestamp.toDate())
}

function formatMessageTime(timestamp) {
  if (!timestamp?.toDate) return ''
  return new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(timestamp.toDate())
}

export default function MessengerInbox() {
  const { user } = useAdminAuth()
  const [conversations, setConversations] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [messages, setMessages] = useState([])
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState('')
  const [listLoading, setListLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [mobileChatOpen, setMobileChatOpen] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    const conversationsQuery = query(
      collection(adminDb, 'messenger_conversations'),
      orderBy('lastMessageAt', 'desc'),
      limit(100),
    )
    const unsubscribe = onSnapshot(conversationsQuery, snapshot => {
      setConversations(snapshot.docs.map(document => ({
        id: document.id,
        ...document.data(),
      })))
      setListLoading(false)
      setError('')
    }, snapshotError => {
      console.error('Messenger conversations error:', snapshotError)
      setError('โหลดห้องสนทนาไม่สำเร็จ กรุณาตรวจสอบสิทธิ์และ Firestore Rules')
      setListLoading(false)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    if (!selectedId) return undefined
    setMessagesLoading(true)
    const messagesQuery = query(
      collection(adminDb, 'messenger_conversations', selectedId, 'messages'),
      orderBy('timestamp', 'asc'),
      limitToLast(200),
    )
    const unsubscribe = onSnapshot(messagesQuery, snapshot => {
      setMessages(snapshot.docs.map(document => ({
        id: document.id,
        ...document.data(),
      })))
      setMessagesLoading(false)
      setError('')
    }, snapshotError => {
      console.error('Messenger messages error:', snapshotError)
      setError('โหลดข้อความไม่สำเร็จ')
      setMessagesLoading(false)
    })
    return unsubscribe
  }, [selectedId])

  const callAdminApi = useCallback(async body => {
    if (!user) throw new Error('กรุณาเข้าสู่ระบบใหม่')
    const token = await user.getIdToken()
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.error || 'เรียก API ไม่สำเร็จ')
    return data
  }, [user])

  const selectedConversation = conversations.find(item => item.id === selectedId)
  const selectedUnreadCount = selectedConversation?.unreadCount || 0

  useEffect(() => {
    if (!selectedId || !selectedUnreadCount) return
    callAdminApi({ action: 'read', conversationId: selectedId }).catch(readError => {
      console.error('Unable to mark Messenger conversation as read:', readError)
    })
  }, [selectedId, selectedUnreadCount, callAdminApi])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const filteredConversations = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return conversations
    return conversations.filter(item =>
      `${item.displayName || ''} ${item.lastMessageText || ''}`.toLowerCase().includes(term),
    )
  }, [conversations, search])

  function selectConversation(id) {
    setSelectedId(id)
    setMessages([])
    setMobileChatOpen(true)
    setError('')
  }

  async function handleSend(event) {
    event.preventDefault()
    const text = draft.trim()
    if (!selectedId || !text || sending) return

    setSending(true)
    setError('')
    try {
      await callAdminApi({ action: 'reply', conversationId: selectedId, text })
      setDraft('')
    } catch (sendError) {
      setError(sendError.message || 'ส่งข้อความไม่สำเร็จ')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">ข้อความ Facebook</h1>
          <p className="text-sm text-slate-500">อ่านและตอบข้อความจาก Facebook Page</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          อัปเดตอัตโนมัติ
        </span>
      </div>

      {error && (
        <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid h-[calc(100vh-190px)] min-h-[560px] grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:grid-cols-[320px_1fr]">
        <aside className={`${mobileChatOpen ? 'hidden' : 'flex'} min-h-0 flex-col border-r border-slate-200 md:flex`}>
          <div className="border-b border-slate-200 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="ค้นหาห้องสนทนา"
                className="w-full rounded-xl bg-slate-100 py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {listLoading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-blue-700" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center px-6 text-center text-slate-500">
                <MessageCircle className="mb-3 h-10 w-10 text-slate-300" />
                <p className="text-sm">ยังไม่มีข้อความจาก Facebook</p>
                <p className="mt-1 text-xs">ข้อความใหม่จะแสดงที่นี่อัตโนมัติ</p>
              </div>
            ) : (
              filteredConversations.map(conversation => (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => selectConversation(conversation.id)}
                  className={`flex w-full gap-3 border-b border-slate-100 px-4 py-4 text-left hover:bg-slate-50 ${selectedId === conversation.id ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-slate-900">
                        {conversation.displayName || 'ผู้ใช้ Facebook'}
                      </span>
                      <span className="shrink-0 text-[11px] text-slate-400">
                        {formatTime(conversation.lastMessageAt)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <p className="truncate text-xs text-slate-500">
                        {conversation.lastDirection === 'outgoing' ? 'คุณ: ' : ''}
                        {conversation.lastMessageText}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-700 px-1.5 text-[10px] font-bold text-white">
                          {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        <section className={`${mobileChatOpen ? 'flex' : 'hidden'} min-h-0 flex-col md:flex`}>
          {!selectedId ? (
            <div className="hidden h-full flex-col items-center justify-center text-slate-500 md:flex">
              <div className="mb-4 rounded-full bg-slate-100 p-5">
                <MessageCircle className="h-10 w-10 text-slate-400" />
              </div>
              <p className="font-medium">เลือกห้องสนทนาเพื่ออ่านข้อความ</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setMobileChatOpen(false)}
                  className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
                  aria-label="กลับไปรายการข้อความ"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    {selectedConversation?.displayName || 'ผู้ใช้ Facebook'}
                  </h2>
                  <p className="text-xs text-slate-500">Facebook Messenger</p>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6">
                {messagesLoading && messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-700" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map(message => (
                      <div key={message.id} className={`flex ${message.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm sm:max-w-[70%] ${message.direction === 'outgoing' ? 'rounded-br-md bg-blue-700 text-white' : 'rounded-bl-md border border-slate-200 bg-white text-slate-800'}`}>
                          {message.text && (
                            <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.text}</p>
                          )}
                          {message.attachments?.length > 0 && (
                            <div className={`space-y-2 ${message.text ? 'mt-2' : ''}`}>
                              {message.attachments.map((attachment, index) => (
                                attachment.type === 'image' && attachment.url ? (
                                  <a key={`${attachment.url}-${index}`} href={attachment.url} target="_blank" rel="noreferrer">
                                    <img src={attachment.url} alt="ไฟล์แนบจาก Facebook" className="max-h-64 rounded-xl object-cover" />
                                  </a>
                                ) : (
                                  <a
                                    key={`${attachment.url || attachment.type}-${index}`}
                                    href={attachment.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`flex items-center gap-2 text-sm underline ${message.direction === 'outgoing' ? 'text-blue-100' : 'text-blue-700'}`}
                                  >
                                    <Paperclip className="h-4 w-4" />
                                    เปิดไฟล์แนบ ({attachment.type})
                                  </a>
                                )
                              ))}
                            </div>
                          )}
                          <p className={`mt-1 text-right text-[10px] ${message.direction === 'outgoing' ? 'text-blue-100' : 'text-slate-400'}`}>
                            {formatMessageTime(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={bottomRef} />
                  </div>
                )}
              </div>

              <form onSubmit={handleSend} className="flex items-end gap-2 border-t border-slate-200 bg-white p-3 sm:p-4">
                <textarea
                  value={draft}
                  onChange={event => setDraft(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault()
                      event.currentTarget.form?.requestSubmit()
                    }
                  }}
                  rows={1}
                  maxLength={2000}
                  placeholder="พิมพ์ข้อความตอบกลับ…"
                  className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || sending}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-40"
                  aria-label="ส่งข้อความ"
                >
                  {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
