import React, { useState, useEffect, useRef } from 'react'
import { socket, backendURL } from '../constants'
import { useGameStore } from '../store/useGameStore'

const Chat = ({ isOpened }) => {
  const { roomCode, roomId, setRoomId } = useGameStore()
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [isOpen, setIsOpen] = useState(isOpened || false)
  const [unreadCount, setUnreadCount] = useState(0)
  const messagesEndRef = useRef(null)

  // Resolve roomId if not present
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

  // Load and listen for messages
  useEffect(() => {
    const activeRoomId = roomId || roomCode
    if (!activeRoomId) return

    socket.emit('loadMessages', { roomId: activeRoomId })

    const handleMessagesLoaded = (loadedMessages) => {
      setMessages(loadedMessages || [])
    }

    const handleNewMessage = (msg) => {
      setMessages((prev) => [...prev, msg])
      if (!isOpen) {
        setUnreadCount((count) => count + 1)
      }
    }

    socket.on('messagesLoaded', handleMessagesLoaded)
    socket.on('newMessage', handleNewMessage)

    return () => {
      socket.off('messagesLoaded', handleMessagesLoaded)
      socket.off('newMessage', handleNewMessage)
    }
  }, [roomId, roomCode, isOpen])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isOpen])

  const handleToggle = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      setUnreadCount(0)
    }
  }

  const handleSend = (e) => {
    e.preventDefault()
    if (!text.trim()) return

    const activeRoomId = roomId || roomCode
    socket.emit('sendMessage', {
      roomId: activeRoomId,
      text: text.trim(),
    })

    setText('')
  }

  return (
    <div className='fixed top-4 right-4 z-50 flex flex-col items-end'>
      {/* Chat Window */}
      {isOpen && (
        <div className='w-80 sm:w-96 h-96 bg-gray-900/95 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden mb-3 animate-in fade-in duration-200'>
          {/* Header */}
          <div className='bg-white/10 px-4 py-3 border-b border-white/10 flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <div className='w-3 h-3 rounded-full bg-green-500 animate-pulse' />
              <h3 className='font-semibold text-white text-sm'>Room Chat</h3>
            </div>
            <button
              onClick={handleToggle}
              className='text-gray-400 hover:text-white text-lg font-bold px-2'
            >
              ✕
            </button>
          </div>

          {/* Messages Feed */}
          <div className='flex-1 p-3 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-white/20'>
            {messages.length === 0 ? (
              <div className='h-full flex items-center justify-center text-gray-400 text-xs italic'>
                No messages yet. Say hi!
              </div>
            ) : (
              messages.map((msg, index) => {
                const isSelf =
                  msg.senderId?._id === socket.playerId ||
                  msg.senderId === socket.playerId
                const senderName = msg.senderId?.name || 'Player'
                const senderPfp = msg.senderId?.pfp

                return (
                  <div
                    key={msg._id || index}
                    className={`flex gap-2 items-start ${
                      isSelf ? 'flex-row-reverse' : ''
                    }`}
                  >
                    {senderPfp && (
                      <img
                        src={senderPfp}
                        alt={senderName}
                        className='w-7 h-7 rounded-full border border-white/20 mt-1 shrink-0'
                      />
                    )}
                    <div
                      className={`max-w-[75%] rounded-xl px-3 py-2 text-xs ${
                        isSelf
                          ? 'bg-blue-600 text-white rounded-tr-none'
                          : 'bg-white/15 text-gray-100 rounded-tl-none border border-white/10'
                      }`}
                    >
                      {!isSelf && (
                        <div className='font-bold text-[10px] text-blue-300 mb-0.5'>
                          {senderName}
                        </div>
                      )}
                      <p className='wrap-break-word leading-relaxed'>
                        {msg.text}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form
            onSubmit={handleSend}
            className='p-2 border-t border-white/10 bg-black/20 flex gap-2'
          >
            <input
              type='text'
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder='Type a message...'
              className='flex-1 bg-white/10 text-white text-xs px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-blue-400 placeholder-gray-400'
            />
            <button
              type='submit'
              disabled={!text.trim()}
              className='bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all'
            >
              Send
            </button>
          </form>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={handleToggle}
        className='relative bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-full shadow-lg border border-white/20 transition-transform active:scale-95 flex items-center justify-center'
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
          <span className='absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-gray-900 animate-bounce'>
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  )
}

export default Chat
