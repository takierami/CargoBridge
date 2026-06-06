import { useState, useRef, useEffect, useMemo } from 'react'
import { Send, Search, Paperclip, Mic, Image, MessageSquare } from 'lucide-react'
import { useAppStore } from '../../../store/appStore'
import { formatTime, formatDate, isToday, isYesterday, isSameDay } from '../../../utils/dateUtils'
import { cn } from '../../utils/cn'
import { chatService } from '../../../services/chatService'
import type { Message } from '../../../types'

export function Chat() {
  const { t, language, role } = useAppStore()
  const [messages, setMessages] = useState<Message[]>(() => chatService.getAll())
  const [text, setText] = useState('')
  const [search, setSearch] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const isRTL = language === 'ar'

  const filteredMessages = useMemo(() => {
    if (!search) return messages
    return messages.filter(m =>
      m.content.toLowerCase().includes(search.toLowerCase())
    )
  }, [messages, search])

  const getDayLabel = (timestamp: string): string => {
    if (isToday(timestamp)) return t('chat.today')
    if (isYesterday(timestamp)) return t('chat.yesterday')
    return formatDate(timestamp, language)
  }

  const messagesWithDividers = useMemo(() => {
    const result: Array<{ type: 'divider'; label: string } | { type: 'message'; msg: typeof messages[0] }> = []
    let lastDay = ''
    filteredMessages.forEach(msg => {
      const day = msg.timestamp.split('T')[0]
      if (day !== lastDay) {
        result.push({ type: 'divider', label: getDayLabel(msg.timestamp) })
        lastDay = day
      }
      result.push({ type: 'message', msg })
    })
    return result
  }, [filteredMessages, language])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    chatService.markRead('main', role)
  }, [role])

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    const newMsg = chatService.create({
      conversationId: 'main',
      senderId: role === 'china_admin' ? 'china-1' : 'algeria-1',
      senderName: role === 'china_admin' ? 'مدير الصين' : 'مدير الجزائر',
      senderRole: role,
      content: trimmed,
      type: 'text',
    })
    setMessages(prev => [...prev, newMsg])
    setText('')
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const unreadCount = messages.filter(m => m.senderRole !== role && !m.read).length
  const otherName = role === 'china_admin' ? t('chat.algeriaAdmin') : t('chat.chinaAdmin')
  const myName = role === 'china_admin' ? t('chat.chinaAdmin') : t('chat.algeriaAdmin')

  return (
    <div className="flex flex-col h-full" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Sidebar + Chat layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Conversation List (simplified - single conversation) */}
        <div className="w-72 border-e border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col hidden lg:flex">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3">{t('chat.title')}</h2>
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('chat.searchMessages')}
                className="w-full ps-8 pe-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Single conversation card */}
          <div className="flex-1 overflow-y-auto p-2">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 cursor-pointer">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                  {role === 'china_admin' ? 'ج' : 'ص'}
                </div>
                <div className="absolute bottom-0 end-0 w-3 h-3 rounded-full bg-green-400 border-2 border-white dark:border-gray-800" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{otherName}</p>
                  {unreadCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">{t('chat.between')}</p>
              </div>
            </div>
          </div>

          {/* Role indicator */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                {role === 'china_admin' ? 'ص' : 'ج'}
              </div>
              <div>
                <p className="text-xs font-medium text-gray-900 dark:text-white">{myName}</p>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  <p className="text-xs text-gray-500">{t('chat.online')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
          {/* Chat Header */}
          <div className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-5 gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                {role === 'china_admin' ? 'ج' : 'ص'}
              </div>
              <div className="absolute bottom-0 end-0 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-white dark:border-gray-800" />
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-900 dark:text-white">{otherName}</p>
              <p className="text-xs text-green-500">{t('chat.online')}</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <MessageSquare className="w-16 h-16 mb-3 opacity-30" />
                <p>{t('chat.noMessages')}</p>
              </div>
            ) : (
              messagesWithDividers.map((item, i) => {
                if (item.type === 'divider') {
                  return (
                    <div key={`divider-${i}`} className="flex items-center gap-3 py-2">
                      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                      <span className="text-xs text-gray-400 px-2 flex-shrink-0">{item.label}</span>
                      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                    </div>
                  )
                }

                const { msg } = item
                const isMe = msg.senderRole === role
                return (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex items-end gap-2 mb-1',
                      isMe ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {!isMe && (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mb-1">
                        {msg.senderName.charAt(0)}
                      </div>
                    )}
                    <div className={cn('max-w-[70%] group', isMe && 'items-end flex flex-col')}>
                      {!isMe && (
                        <p className="text-xs text-gray-500 mb-1 ps-1">{msg.senderName}</p>
                      )}
                      <div
                        className={cn(
                          'px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
                          isMe
                            ? 'bg-blue-600 text-white rounded-ee-sm'
                            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-es-sm'
                        )}
                      >
                        {msg.content}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5 px-1">
                        {formatTime(msg.timestamp, language)}
                        {isMe && (
                          <span className="ms-1">{msg.read ? '✓✓' : '✓'}</span>
                        )}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3">
            <div className="flex items-end gap-2">
              {/* Attachment buttons */}
              <div className="flex gap-1">
                <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 transition-colors" title={t('chat.attachFile')}>
                  <Paperclip className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 transition-colors" title={t('chat.voiceMessage')}>
                  <Mic className="w-4 h-4" />
                </button>
              </div>

              <textarea
                ref={inputRef}
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('chat.typeMessage')}
                rows={1}
                className="flex-1 resize-none px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-24 overflow-y-auto"
                style={{ scrollbarWidth: 'thin' }}
              />

              <button
                onClick={handleSend}
                disabled={!text.trim()}
                className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              >
                <Send className="w-4 h-4" style={{ transform: isRTL ? 'scaleX(-1)' : 'none' }} />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1.5 text-center">
              {language === 'ar' ? 'Enter للإرسال · Shift+Enter لسطر جديد' : 'Entrée pour envoyer · Shift+Entrée pour nouvelle ligne'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
