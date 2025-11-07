import { socket } from '../constants'
import Card from '../components/Card'
import { useEffect } from 'react'
import { useGameStore } from '../store/useGameStore'
import { useNavigate } from 'react-router'

const Game = () => {
  const navigate = useNavigate()
  const { roomCode, players } = useGameStore()

  useEffect(() => {
    if (!roomCode) {
      navigate('/')
    }

    const handlePlayers = () => {}

    socket.on('gameStarted', handlePlayers)

    return () => {
      socket.off('gameStarted', handlePlayers)
    }
  }, [roomCode, navigate])

  const currentPlayer = players.find((p) => p.id === socket.id)
  const otherPlayer = players.find((p) => p.id !== socket.id)
  return !otherPlayer || !currentPlayer ? (
    <div className='text-white text-center mt-20'>Waiting for players...</div>
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
      <div className='flex-1'></div>
      <div className='space-y-2 flex flex-col items-center'>
        <Card text={'none'} flip={true} />
        <p>{currentPlayer.name}</p>
        <img
          src={currentPlayer.avatar}
          alt={currentPlayer.name}
          className='w-15 h-15'
        />
      </div>
    </div>
  )
}

export default Game
