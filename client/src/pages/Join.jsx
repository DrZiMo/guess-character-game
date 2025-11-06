import { useNavigate } from 'react-router'
import headerText from '/Room.png'
import { useState } from 'react'
import { avatars, socket } from '../constants'
import { useGameStore } from '../store/useGameStore'
import AvatarPicker from '../components/AvatarPicker'
import ErrorMessage from '../components/ErrorMessage'
import { useEffect } from 'react'

const Join = () => {
  const navigate = useNavigate()
  const [nameError, setNameError] = useState()
  const [codeError, setCodeError] = useState()
  const [code, setRoomCode] = useState('')
  const [nickName, setNickname] = useState('')
  const [avatar, setAvatar] = useState(avatars[8])
  const [show, setShow] = useState(false)
  const { setName, setCode, setIsCreator, setImg, setPlayers } = useGameStore()

  useEffect(() => {
    const handlePlayerJoined = (players) => {
      setPlayers(players)
      alert(players)
    }

    socket.on('playerJoined', handlePlayerJoined)
  }, [])

  const handleJoin = () => {
    if (!nickName.trim()) return setNameError('Enter your nickname')
    if (!code.trim()) return setCodeError('Enter the code')

    socket.emit('joinRoom', {
      code: code.trim(),
      name: nickName.trim(),
      avatar,
    })
  }

  return (
    <div className='w-full h-full flex flex-col justify-center items-center'>
      <div className='text-center'>
        <img src={headerText} alt='Header Text' />
      </div>
      <div className='flex flex-col w-[75%] gap-3 mt-10'>
        <div className='relative'>
          <div>
            <img
              src={avatar || avatars[8]}
              className='w-30 h-30 mx-auto rounded-full mb-10'
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
          autoComplete='false'
          onChange={(e) => setNickname(e.target.value)}
          className='w-full bg-[rgba(255,255,255,0.25)] px-4 py-5 rounded-md border-b-5 border-white focus:outline-0 text-white'
        />
        <ErrorMessage message={nameError} />
        <input
          type='text'
          placeholder='Code'
          autoComplete='false'
          onChange={(e) => setRoomCode(e.target.value)}
          className='w-full bg-[rgba(255,255,255,0.25)] px-4 py-5 rounded-md border-b-5 border-white focus:outline-0 text-white'
        />
        <ErrorMessage message={codeError} />
        <button
          className='primary-btn'
          onClick={handleJoin}
          disabled={!nickName.trim() || !code.trim()}
        >
          join
        </button>
      </div>
    </div>
  )
}

export default Join
