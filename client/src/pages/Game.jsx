import { socket } from '../constants'
import Card from '../components/Card'
import { useEffect, useState } from 'react'
import { useGameStore } from '../store/useGameStore'
import { useNavigate } from 'react-router'
import ConfirmModal from '../components/ConfirmModal'

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
    navigate('/', {
      replace: true,
    })
  }

  const currentPlayer = players.find((p) => p.id === socket.id)
  const otherPlayer = players.find((p) => p.id !== socket.id)
  return (
    <>
      <ConfirmModal
        open={showModal}
        title='Reveal the Word?'
        message='Are you sure you want to see the other player’s word?'
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />

      {!otherPlayer || !currentPlayer ? (
        <div className='text-white text-center mt-20'>
          Waiting for players...
        </div>
      ) : (
        <div className='flex flex-col h-full items-center p-5 text-center text-white'>
          <div className='space-y-2 flex flex-col items-center'>
            <img
              src={otherPlayer.avatar}
              alt={otherPlayer.name}
              className='w-15 h-15'
            />
            <p>{otherPlayer.name}</p>
            <Card text={currentPlayer.word} />
          </div>
          <div className='flex-1 flex items-center justify-center w-full'>
            {isShows ? (
              <div className='w-fit'>
                <button className='primary-btn px-5' onClick={handleRestart}>
                  restart
                </button>
              </div>
            ) : null}
          </div>
          <div className='space-y-2 flex flex-col items-center'>
            <div
              className={`w-fit ${isShows ? '' : 'cursor-pointer'}`}
              onClick={isShows ? null : handleClick}
            >
              <Card text={isShows ? otherPlayer.word : 'none'} flip={true} />
            </div>
            <p>{currentPlayer.name}</p>
            <img
              src={currentPlayer.avatar}
              alt={currentPlayer.name}
              className='w-15 h-15'
            />
          </div>
        </div>
      )}
    </>
  )
}

export default Game
