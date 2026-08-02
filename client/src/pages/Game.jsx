import { socket, avatars } from '../constants'
import Card from '../components/Card'
import { useEffect, useState } from 'react'
import { useGameStore } from '../store/useGameStore'
import { useNavigate } from 'react-router'
import ConfirmModal from '../components/ConfirmModal'
import Chat from '../components/Chat'

const Game = () => {
  const navigate = useNavigate()
  const { roomCode, players } = useGameStore()
  const [isShows, setIsShows] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (!roomCode) {
      navigate('/', { replace: true })
    }

    const handleShowResult = (id) => {
      if (socket.id === id) {
        setShowModal(true)
      }
    }

    const handleReveal = () => {
      setIsShows(true)
      setShowModal(false)
    }

    socket.on('playerSurrend', handleShowResult)
    socket.on('revealResult', handleReveal)

    return () => {
      socket.off('playerSurrend', handleShowResult)
      socket.off('revealResult', handleReveal)
    }
  }, [roomCode, navigate])

  const handleClick = () => {
    if (!roomCode) return
    socket.emit('seeResult', roomCode)
  }

  const handleConfirm = () => {
    socket.emit('confirmReveal', roomCode)
  }

  const handleCancel = () => {
    setIsShows(false)
    setShowModal(false)
  }

  const handleRestart = () => {
    setIsShows(false)
    setShowModal(false)
    if (roomCode) {
      socket.emit('endGame', roomCode)
    }
    navigate('/', {
      replace: true,
    })
  }

  const currentPlayer = players.find((p) => p.socketId === socket.id || p.id === socket.id) || players[0]
  const otherPlayer = players.find((p) => p.socketId !== socket.id && p.id !== socket.id) || players[1]

  const currentPlayerPfp = currentPlayer?.avatar || currentPlayer?.pfp || avatars[0]
  const otherPlayerPfp = otherPlayer?.avatar || otherPlayer?.pfp || avatars[1]

  return (
    <div className='text-white h-full flex-1 flex flex-col justify-between relative w-full px-4 py-6'>
      <ConfirmModal
        open={showModal}
        title='Reveal the Word?'
        message='Are you sure you want to see the other player’s word?'
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />

      {!otherPlayer || !currentPlayer ? (
        <div className='text-white text-center mt-20 text-lg animate-pulse'>
          Waiting for players...
        </div>
      ) : (
        <div className='flex flex-1 flex-col justify-between gap-5 my-auto'>
          {/* Opponent Section */}
          <div className='space-y-2 flex flex-col items-center'>
            <img
              src={otherPlayerPfp}
              alt={otherPlayer.name || 'Opponent'}
              className='w-16 h-16 rounded-full border-2 border-white/20 object-cover shadow'
            />
            <p className='font-semibold text-yellow-300'>{otherPlayer.name || 'Opponent'}</p>
            <Card text={currentPlayer.word} />
          </div>

          {/* Center Info / Restart */}
          <div className='flex-1 flex items-center justify-center w-full my-4'>
            {isShows ? (
              <div className='w-fit'>
                <button className='primary-btn px-6 py-3 font-bold text-lg' onClick={handleRestart}>
                  Restart Game
                </button>
              </div>
            ) : (
              <div className='w-fit text-center bg-white/10 px-6 py-2 rounded-full border border-white/10'>
                <p className='text-sm text-gray-300 uppercase tracking-widest'>Category</p>
                <p className='font-bold text-lg text-yellow-300'>Famous People</p>
              </div>
            )}
          </div>

          {/* Current Player Section */}
          <div className='space-y-2 flex flex-col items-center'>
            <div
              className={`w-fit ${isShows ? '' : 'cursor-pointer'}`}
              onClick={isShows ? null : handleClick}
            >
              <Card text={isShows ? otherPlayer.word : 'none'} flip={true} />
            </div>
            <p className='font-semibold text-blue-300'>{currentPlayer.name || 'You'}</p>
            <img
              src={currentPlayerPfp}
              alt={currentPlayer.name || 'You'}
              className='w-16 h-16 rounded-full border-2 border-white/20 object-cover shadow'
            />
          </div>
        </div>
      )}

      {/* Real-time Chat Drawer */}
      <Chat />
    </div>
  )
}

export default Game
