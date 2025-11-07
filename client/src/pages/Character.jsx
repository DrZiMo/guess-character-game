import { useEffect, useState } from 'react'
import ErrorMessage from '../components/ErrorMessage'
import headerText from '/Character.png'
import { useNavigate } from 'react-router'
import { avatars, socket } from '../constants'
import { useGameStore } from '../store/useGameStore'
import AvatarPicker from '../components/AvatarPicker'

const Character = () => {
  const navigate = useNavigate()
  const [error, setError] = useState()
  const [nickName, setNickname] = useState('')
  const [avatar, setAvatar] = useState(avatars[7])
  const [show, setShow] = useState(false)
  const { setName, setCode, setIsCreator, setImg } = useGameStore()

  useEffect(() => {
    const handleRoomCreated = (code) => {
      setCode(code)
      setName(nickName)
      setIsCreator(true)
      setImg(avatar)

      navigate('/room?u=creator', { replace: true })
    }

    socket.on('roomCreated', handleRoomCreated)

    return () => {
      socket.off('roomCreated', handleRoomCreated)
    }
  }, [nickName, setIsCreator, setName, setCode, navigate, setImg, avatar])

  const handleCreate = () => {
    if (!nickName.trim()) return setError('Enter your nickname')

    socket.emit('createRoom', { name: nickName.trim(), avatar })
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
              src={avatar || avatars[7]}
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
        <ErrorMessage message={error} />
        <button
          className='primary-btn'
          onClick={handleCreate}
          disabled={!nickName.trim()}
        >
          create
        </button>
      </div>
    </div>
  )
}

export default Character
