import headerText from '/Room.png'
import { useGameStore } from '../store/useGameStore'
import { useEffect } from 'react'
import { socket, toastId } from '../constants'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import toast from 'react-hot-toast'

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

    const handlePlayerJoined = (players) => {
      console.log('Player joined:', players)
      if (isCreator) {
        setLocalPlayers(players)
      } else {
        setPlayers(players)
      }
    }

    const handlePlayerLeft = (playerName) => {
      toast.error(`${playerName} left!`, {
        id: toastId,
        duration: 1000,
      })

      if (isCreator) {
        setLocalPlayers((prev) => prev.filter((p) => p.name !== playerName))
      } else {
        setPlayers((prev) => prev.filter((p) => p.name !== playerName))
      }
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
  }, [roomCode, navigate, isCreator, setPlayers])

  const handleLeaveRoom = () => {
    if (roomCode) {
      socket.emit('leaveRoom', roomCode)
      navigate('/', { replace: true })
    }
  }

  const currentPlayers = (isCreator ? localPlayers : storePlayers) || []

  const otherPlayer = Array.isArray(currentPlayers)
    ? currentPlayers.find((p) => p && p.id !== socket.id)
    : null

  const handleStart = () => {
    socket.emit('startClicked', roomCode)
  }

  return (
    <div className='w-full h-full flex flex-col justify-center items-center'>
      <div className='text-center space-y-5'>
        <img src={headerText} alt='Header Text' />
        <p className='text-white text-2xl'>{roomCode}</p>
      </div>

      {/* Leave Room Button */}
      <div className='absolute top-4 right-4'>
        <button
          onClick={handleLeaveRoom}
          className='bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md'
        >
          Leave Room
        </button>
      </div>

      <div className='text-white w-full text-center'>
        {otherPlayer ? (
          <div className='w-[80%] mx-auto text-center'>
            <div className='space-y-3 my-12'>
              <img
                src={otherPlayer.avatar}
                alt={otherPlayer.name}
                className='w-30 h-30 mx-auto'
              />
              <p className='text-xl'>{otherPlayer.name}</p>
            </div>
            {isCreator ? (
              <div>
                <button className='primary-btn' onClick={handleStart}>
                  Start
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className='my-12'>waiting player ...</div>
        )}
      </div>
    </div>
  )
}

export default Room
