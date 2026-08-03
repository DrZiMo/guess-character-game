import { useNavigate, useSearchParams } from 'react-router'
import headerText from '/Room.png'
import { useState, useEffect } from 'react'
import { avatars, socket } from '../constants'
import { useGameStore } from '../store/useGameStore'
import AvatarPicker from '../components/AvatarPicker'
import ErrorMessage from '../components/ErrorMessage'

const JoinOnline = () => {
  const navigate = useNavigate()

  const [params] = useSearchParams()
  const code = params.get('code') || ''

  const [nameError, setNameError] = useState('')
  const [nickName, setNickname] = useState('')
  const [avatar, setAvatar] = useState(avatars[8])
  const [show, setShow] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const { setCode, setRoomId, setPlayers, setName, setImg } = useGameStore()

  useEffect(() => {
    if (code) {
      setCode(code)
    } else {
      navigate('/join-type')
    }

    const handlePlayerJoined = (players) => {
      setIsJoining(false)
      setPlayers(players)
      setName(nickName)
      setImg(avatar)
      navigate('/room?u=player', { replace: true })
    }

    const handleRoomJoined = (roomData) => {
      if (roomData?.roomId) {
        setRoomId(roomData.roomId)
      }
    }

    const handleRoomFull = () => {
      setIsJoining(false)
      setNameError('This room is already full (2/2 players)!')
    }

    const handleRoomNotFound = () => {
      setIsJoining(false)
      setNameError('Room not found or code is invalid!')
    }

    socket.on('playerJoined', handlePlayerJoined)
    socket.on('roomJoined', handleRoomJoined)
    socket.on('roomFull', handleRoomFull)
    socket.on('roomNotFound', handleRoomNotFound)

    return () => {
      socket.off('playerJoined', handlePlayerJoined)
      socket.off('roomJoined', handleRoomJoined)
      socket.off('roomFull', handleRoomFull)
      socket.off('roomNotFound', handleRoomNotFound)
    }
  }, [
    code,
    nickName,
    avatar,
    navigate,
    setCode,
    setRoomId,
    setPlayers,
    setName,
    setImg,
  ])

  const handleJoin = () => {
    setNameError('')

    if (!nickName.trim()) return setNameError('Enter your nickname')

    setIsJoining(true)

    socket.emit('joinRoom', {
      code: code.trim(),
      name: nickName.trim(),
      avatar,
    })
  }

  return (
    <div className='w-full h-full flex flex-col justify-center items-center'>
      <div className='text-center space-y-2'>
        <img src={headerText} alt='Header Text' />
        <p className='text-white text-2xl font-bold tracking-widest'>{code}</p>
      </div>
      <div className='flex flex-col w-[75%] gap-3 mt-10'>
        <div className='relative'>
          <div>
            <img
              src={avatar || avatars[8]}
              className='w-30 h-30 mx-auto rounded-full mb-10 border-4 border-white/20 cursor-pointer hover:scale-105 transition-transform'
              onClick={() => setShow(!show)}
            />
          </div>
          <AvatarPicker
            onSelect={setAvatar}
            show={show}
            avatars={avatars}
            setShow={setShow}
          />
        </div>
        <input
          type='text'
          placeholder='Nickname'
          autoComplete='off'
          value={nickName}
          disabled={isJoining}
          onChange={(e) => {
            setNickname(e.target.value)
            setNameError('')
          }}
          className='w-full bg-[rgba(255,255,255,0.25)] px-4 py-5 rounded-md border-b-5 border-white focus:outline-0 text-white disabled:opacity-50'
        />
        <ErrorMessage message={nameError} />
        <button
          className='primary-btn disabled:opacity-50'
          onClick={handleJoin}
          disabled={!nickName.trim() || !code.trim() || isJoining}
        >
          {isJoining ? 'joining...' : 'join'}
        </button>
      </div>
    </div>
  )
}

export default JoinOnline
