import React, { useState, useEffect, useRef, useMemo } from 'react'
import { socket, backendURL } from '../constants'
import { useGameStore } from '../store/useGameStore'
import clsx from 'clsx'

const Chat = ({ isOpened }) => {
  const { roomCode, roomId, setRoomId, name, img } = useGameStore()
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [isOpen, setIsOpen] = useState(isOpened || false)
  const [unreadCount, setUnreadCount] = useState(0)
  const listRef = useRef(null)
  const isAtBottomRef = useRef(true)
  const messagesEndRef = useRef(null)

  const activeRoomId = useMemo(() => roomId || roomCode, [roomId, roomCode])

  const getSender = () => ({
    socketId: socket.id,
    name: name || 'Player',
    pfp: img || undefined,
  })

  const generateTempId = () =>
    crypto?.randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(36).slice(2)}`

  useEffect(() => {
    if (!roomId && roomCode) {
      fetch(`${backendURL}/api/rooms/${roomCode}`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.success && data?.data?._id) {
            setRoomId(data.data._id)
          }
        })
        .catch((err) => console.error('Error fetching room ID for chat:', err))
    }
  }, [roomId, roomCode, setRoomId])

  useEffect(() => {
    if (!activeRoomId) return

    socket.emit('loadMessages', { roomId: activeRoomId })

    const handleMessagesLoaded = (loadedMessages) => {
      setMessages((current) => {
        const pending = current.filter(
          (msg) => msg.status === 'pending' || msg.status === 'failed',
        )
        const confirmed = Array.isArray(loadedMessages)
          ? loadedMessages.map((msg) => ({ ...msg, status: 'sent' }))
          : []
        return [...confirmed, ...pending]
      })
    }

    const handleNewMessage = (msg) => {
      setMessages((prevMessages) => {
        const normalized = { ...msg }
        const existingByTemp =
          normalized.tempId &&
          prevMessages.find((item) => item.tempId === normalized.tempId)
        const existingById =
          normalized._id &&
          prevMessages.find((item) => item._id === normalized._id)

        if (existingByTemp) {
          return prevMessages.map((item) =>
            item.tempId === normalized.tempId
              ? { ...normalized, status: 'sent' }
              : item,
          )
        }

        if (existingById) {
          return prevMessages.map((item) =>
            item._id === normalized._id
              ? { ...normalized, status: 'sent' }
              : item,
          )
        }

        return [...prevMessages, { ...normalized, status: 'sent' }]
      })

      if (!isOpen && msg.sender?.socketId !== socket.id) {
        setUnreadCount((count) => count + 1)
      }
    }

    const handleMessageFailed = ({ tempId }) => {
      if (!tempId) return
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.tempId === tempId ? { ...msg, status: 'failed' } : msg,
        ),
      )
    }

    socket.on('messagesLoaded', handleMessagesLoaded)
    socket.on('newMessage', handleNewMessage)
    socket.on('messageFailed', handleMessageFailed)

    return () => {
      socket.off('messagesLoaded', handleMessagesLoaded)
      socket.off('newMessage', handleNewMessage)
      socket.off('messageFailed', handleMessageFailed)
    }
  }, [activeRoomId, isOpen])

  useEffect(() => {
    if (!listRef.current || !messagesEndRef.current) return
    if (isAtBottomRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleScroll = () => {
    const node = listRef.current
    if (!node) return
    const distanceFromBottom =
      node.scrollHeight - node.scrollTop - node.clientHeight
    isAtBottomRef.current = distanceFromBottom < 40
  }

  const handleToggle = () => {
    setIsOpen((open) => {
      const next = !open
      if (next) {
        setUnreadCount(0)
      }
      return next
    })
  }

  const handleSend = (e) => {
    e.preventDefault()
    const normalizedText = text.trim()
    if (!normalizedText || !activeRoomId) return

    const tempId = generateTempId()
    const optimisticMessage = {
      tempId,
      sender: getSender(),
      text: normalizedText,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }

    setMessages((prevMessages) => [...prevMessages, optimisticMessage])
    setText('')

    socket.emit('sendMessage', {
      roomId: activeRoomId,
      text: normalizedText,
      tempId,
    })
  }

  const handleRetry = (message) => {
    if (!activeRoomId || message.status !== 'failed') return
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg.tempId === message.tempId ? { ...msg, status: 'pending' } : msg,
      ),
    )
    socket.emit('sendMessage', {
      roomId: activeRoomId,
      text: message.text,
      tempId: message.tempId,
    })
  }

  const renderStatus = (msg) => {
    if (msg.status === 'pending') {
      return (
        <div className='mt-1 flex items-center justify-end gap-2 text-[10px] text-gray-200'>
          <span className='w-2.5 h-2.5 rounded-full border border-white/70 animate-pulse' />
        </div>
      )
    }

    if (msg.status === 'failed') {
      return (
        <div className='mt-1 flex items-center justify-end gap-2 text-[10px] text-rose-300'>
          <span className='inline-flex h-2.5 w-2.5 rounded-full bg-rose-400' />
          <button
            type='button'
            onClick={() => handleRetry(msg)}
            className='underline hover:text-white'
          >
            Retry
          </button>
        </div>
      )
    }

    return null
  }

  return (
    <div
      className={clsx(
        'fixed top-4 z-50 flex flex-col items-end w-screen',
        !isOpen ? 'right-4 animate-bounce' : 'right-0 md:right-4',
      )}
    >
      {isOpen && (
        <div className='w-[95%] mx-auto sm:w-96 h-[90vh] md:h-96 bg-slate-950/80 backdrop-blur-xl border border-slate-300/10 rounded-3xl shadow-[0_24px_80px_-40px_rgba(15,23,42,0.8)] flex flex-col mb-3 animate-in fade-in duration-200'>
          <div className='bg-slate-900/90 px-4 py-3 border-b border-slate-200/10 flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <div>
                <h3 className='font-semibold text-white text-sm tracking-tight'>
                  Room Chat
                </h3>
              </div>
            </div>
            <button
              onClick={handleToggle}
              className='text-slate-400 hover:text-white text-lg font-bold px-2'
            >
              ✕
            </button>
          </div>

          <div
            ref={listRef}
            onScroll={handleScroll}
            className='flex-1 p-3 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-slate-600/40'
          >
            {messages.length === 0 ? (
              <div className='h-full flex items-center justify-center text-slate-500 text-xs italic'>
                No messages yet. Say hi!
              </div>
            ) : (
              messages.map((msg) => {
                const isSelf = msg.sender?.socketId === socket.id
                const senderName = msg.sender?.name || 'Player'
                const senderPfp = msg.sender?.pfp
                const key =
                  msg._id || msg.tempId || `${msg.text}-${msg.createdAt}`

                return (
                  <div
                    key={key}
                    className={`flex gap-3 items-end ${isSelf ? 'flex-row-reverse' : ''}`}
                  >
                    {senderPfp ? (
                      <img
                        src={senderPfp}
                        alt={senderName}
                        className='w-8 h-8 rounded-full border border-slate-700/70 shadow-sm shrink-0'
                      />
                    ) : (
                      <div className='w-8 h-8 rounded-full bg-slate-800 border border-slate-700/70 shadow-sm shrink-0' />
                    )}
                    <div
                      className={`max-w-[76%] rounded-3xl px-4 py-3 text-sm leading-6 transition-all duration-200 ${
                        isSelf
                          ? 'bg-sky-600 text-slate-950 rounded-br-none shadow-[0_8px_24px_-18px_rgba(59,130,246,0.75)]'
                          : 'bg-slate-900/95 text-slate-100 rounded-bl-none border border-slate-700/70'
                      } ${msg.status === 'pending' ? 'opacity-90 border border-dashed border-slate-600' : ''} ${
                        msg.status === 'failed' ? 'ring-1 ring-rose-500/20' : ''
                      }`}
                    >
                      {!isSelf && (
                        <div className='font-semibold text-[10px] uppercase tracking-[0.18em] text-sky-300 mb-1'>
                          {senderName}
                        </div>
                      )}
                      <p className='wrap-break-word'>{msg.text}</p>
                      {renderStatus(msg)}
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={handleSend}
            className='p-3 border-t border-slate-700/40 bg-slate-950/95 flex items-center w-full! gap-2'
          >
            <input
              type='text'
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder='Type a message...'
              className='min-w-0 flex-1 bg-slate-900/90 text-slate-100 text-base md:text-sm px-4 py-3 rounded-2xl border border-slate-700/70 focus:outline-none focus:border-sky-400 placeholder-slate-500 transition'
            />
            <button
              type='submit'
              disabled={!text.trim()}
              className='bg-sky-500 hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-40 text-slate-950 text-sm font-semibold px-4 py-3 rounded-2xl transition-all'
            >
              Send
            </button>
          </form>
        </div>
      )}

      <button
        onClick={handleToggle}
        className='relative bg-sky-600 hover:bg-sky-500 text-white p-3 rounded-full shadow-xl border border-slate-900/30 transition-transform active:scale-95 flex items-center justify-center'
      >
        <svg
          className='w-6 h-6'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
          />
        </svg>
        {unreadCount > 0 && !isOpen && (
          <span className='absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-950'>
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  )
}

export default Chat
