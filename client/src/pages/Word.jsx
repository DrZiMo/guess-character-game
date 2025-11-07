import { useState } from 'react'
import headerText from '/Room.png'
import { useGameStore } from '../store/useGameStore'
import { socket } from '../constants'
import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import ErrorMessage from '../components/ErrorMessage'

const Word = () => {
  const navigate = useNavigate()
  const [word, setWord] = useState('')
  const [error, setError] = useState('')
  const [loading, setIsLoading] = useState(false)
  const { roomCode, name, setPlayers } = useGameStore()

  useEffect(() => {
    if (!roomCode) {
      navigate('/', { replace: true })
      return
    }

    const handleWordsSet = (players) => {
      setPlayers(players)
      setIsLoading(false)
      socket.emit('gameStart', roomCode)
      navigate('/game', { replace: true })
    }

    socket.on('wordsSet', handleWordsSet)

    return () => {
      socket.off('wordsSet', handleWordsSet)
    }
  }, [roomCode, name, navigate, setPlayers])

  const handleSubmitWord = () => {
    setError('')

    if (!word.trim()) {
      setError('Enter a word')
      return
    }

    setIsLoading(true)

    socket.emit('submitWord', {
      code: roomCode,
      word: word.trim().toLowerCase(),
    })
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmitWord()
    }
  }

  return (
    <div className='w-full h-full flex flex-col justify-center items-center'>
      <div className='text-center space-y-5'>
        <img src={headerText} alt='Header Text' />
        <p className='text-white text-2xl'>{roomCode}</p>
      </div>
      <div className='flex flex-col w-[75%] gap-3 mt-10'>
        <p className='text-white'>Enter your word</p>
        <input
          type='text'
          placeholder='Enter your word'
          autoComplete='off'
          value={word}
          disabled={loading}
          onChange={(e) => {
            setWord(e.target.value)
            setError('')
          }}
          onKeyPress={handleKeyPress}
          className='w-full bg-[rgba(255,255,255,0.25)] px-4 py-5 rounded-md border-b-5 border-white focus:outline-0 text-white disabled:opacity-50'
        />

        {/* Error message */}
        <ErrorMessage message={error} />

        <button
          className='primary-btn'
          onClick={handleSubmitWord}
          disabled={!word.trim() || loading}
        >
          {loading ? 'submitted' : 'submit'}
        </button>
        {loading ? (
          <p className='text-white'>Waiting for the other player...</p>
        ) : null}
      </div>
    </div>
  )
}

export default Word
