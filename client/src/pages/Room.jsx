import headerText from '/Room.png'
import { useGameStore } from '../store/useGameStore'
import { useEffect } from 'react'
import { socket } from '../constants'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'

const Room = () => {
  const { roomCode, players } = useGameStore()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [player, setPlayers] = useState([])
  const isCreator = searchParams.get('u') === 'creator'

  useEffect(() => {
    if (!roomCode) {
      navigate('/')
      return
    }

    if (isCreator) {
      const handlePlayerJoined = (players) => setPlayers(players)

      socket.on('playerJoined', handlePlayerJoined)
      return () => socket.off('playerJoined', handlePlayerJoined)
    }
  }, [roomCode, navigate, isCreator])

  const otherPlayer = isCreator
    ? player?.find((p) => p.id !== socket.id)
    : players.find((p) => p.id !== socket.id)

  return (
    <div className='w-full h-full flex flex-col justify-center items-center'>
      <div className='text-center space-y-5'>
        <img src={headerText} alt='Header Text' />
        <p className='text-white text-2xl'>{roomCode}</p>
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
                <button className='primary-btn'>Start</button>
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
