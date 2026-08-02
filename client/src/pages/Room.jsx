import headerText from '/Room.png'
import { useGameStore } from '../store/useGameStore'
import { useEffect, useState } from 'react'
import { socket, toastId, avatars } from '../constants'
import { useNavigate, useSearchParams } from 'react-router'
import { LogOut } from 'lucide-react'
import toast from 'react-hot-toast'
import Chat from '../components/Chat'

const Room = () => {
  const { roomCode, players: storePlayers, setPlayers } = useGameStore()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [localPlayers, setLocalPlayers] = useState([])
  const isCreator = searchParams.get('u') === 'creator'

  useEffect(() => {
    if (!roomCode) {
      navigate('/', { replace: true })
      return
    }

    const handlePlayerJoined = (playersList) => {
      setLocalPlayers(playersList || [])
      setPlayers(playersList || [])
    }

    const handlePlayerLeft = (playerName) => {
      toast.error(`${playerName || 'Player'} left!`, {
        id: toastId,
        duration: 1000,
      })

      const filterLeft = (prev) => prev.filter((p) => p.name !== playerName)
      setLocalPlayers(filterLeft)
      setPlayers(filterLeft)
    }

    const handleRoomClosed = () => {
      toast.error('Room is closed!', { id: toastId, duration: 1000 })
      navigate('/', { replace: true })
    }

    const handleEnterWord = () => {
      navigate('/word', { replace: true })
    }

    socket.on('playerJoined', handlePlayerJoined)
    socket.on('playerLeft', handlePlayerLeft)
    socket.on('roomClosed', handleRoomClosed)
    socket.on('enterWords', handleEnterWord)

    return () => {
      socket.off('playerJoined', handlePlayerJoined)
      socket.off('playerLeft', handlePlayerLeft)
      socket.off('roomClosed', handleRoomClosed)
      socket.off('enterWords', handleEnterWord)
    }
  }, [roomCode, navigate, setPlayers])

  const handleLeaveRoom = () => {
    if (roomCode) {
      socket.emit('leaveRoom', roomCode)
      navigate('/', { replace: true })
    }
  }

  const currentPlayers = localPlayers.length > 0 ? localPlayers : storePlayers

  const otherPlayer = Array.isArray(currentPlayers)
    ? currentPlayers.find(
        (p) => p && p.socketId !== socket.id && p.id !== socket.id,
      )
    : null

  const playerAvatar = otherPlayer?.avatar || otherPlayer?.pfp || avatars[0]

  const handleStart = () => {
    socket.emit('startClicked', roomCode)
  }

  return (
    <div className='w-full h-full flex flex-col justify-center items-center relative'>
      <div className='relative top-0'>
        <button
          onClick={handleLeaveRoom}
          className='bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md font-semibold text-sm transition-all cursor-pointer'
        >
          <LogOut />
        </button>
      </div>

      <div className='text-center space-y-5'>
        <img src={headerText} alt='Header Text' />
        <p className='text-white text-2xl font-bold tracking-widest'>
          {roomCode}
        </p>
      </div>

      <div className='text-white w-full text-center'>
        {otherPlayer ? (
          <div className='w-[80%] mx-auto text-center animate-in fade-in duration-300'>
            <div className='space-y-3 my-12'>
              <img
                src={playerAvatar}
                alt={otherPlayer.name || 'Joined Player'}
                className='w-32 h-32 mx-auto rounded-full border-4 border-white/20 object-cover shadow-lg'
              />
              <p className='text-xl font-bold text-yellow-300'>
                {otherPlayer.name}
              </p>
              <p className='text-xs text-green-400 font-medium'>
                Ready to play!
              </p>
            </div>
            {isCreator ? (
              <div>
                <button
                  className='primary-btn font-bold text-lg px-8 py-3'
                  onClick={handleStart}
                >
                  Start Game
                </button>
              </div>
            ) : (
              <p className='text-sm text-gray-300 italic'>
                Waiting for room host to start...
              </p>
            )}
          </div>
        ) : (
          <div className='my-12 text-gray-300 animate-pulse text-lg'>
            Waiting for player to join...
          </div>
        )}
      </div>

      {/* Real-time Chat Drawer */}
      <Chat />
    </div>
  )
}

export default Room
