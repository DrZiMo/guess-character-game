import { useEffect, useRef, useState } from 'react'
import ErrorMessage from '../components/ErrorMessage'
import headerText from '/Character.png'
import { useNavigate } from 'react-router'
import { avatars, socket } from '../constants'
import { useGameStore } from '../store/useGameStore'
import AvatarPicker from '../components/AvatarPicker'

const Character = () => {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [nickName, setNickname] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [avatar, setAvatar] = useState(avatars[7])
  const [show, setShow] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const pendingRoomRef = useRef(null)
  const {
    setName,
    setCode,
    setRoomId,
    setIsCreator,
    setImg,
    setCategory,
    category,
  } = useGameStore()

  useEffect(() => {
    const handleRoomCreated = (roomData) => {
      setIsCreating(false)
      const submitted = pendingRoomRef.current
      pendingRoomRef.current = null

      const code = typeof roomData === 'object' ? roomData.code : roomData
      const id = typeof roomData === 'object' ? roomData._id : null

      setCode(code)
      if (submitted?.category) setCategory(submitted.category)
      else if (roomData?.category) setCategory(roomData.category)
      if (id) setRoomId(id)
      setName(submitted?.name ?? nickName)
      setIsCreator(true)
      setImg(submitted?.avatar ?? avatar)

      navigate('/room?u=creator', { replace: true })
    }

    const handleRoomCreationFailed = () => {
      setIsCreating(false)
      setError('Failed to create room. Please try again.')
    }

    socket.on('roomCreated', handleRoomCreated)
    socket.on('roomCreationFailed', handleRoomCreationFailed)

    return () => {
      socket.off('roomCreated', handleRoomCreated)
      socket.off('roomCreationFailed', handleRoomCreationFailed)
    }
  }, [
    nickName,
    setIsCreator,
    setName,
    setCode,
    navigate,
    setImg,
    avatar,
    setRoomId,
    setCategory,
  ])

  const handleCreate = () => {
    setError('')
    if (!nickName.trim()) return setError('Enter your nickname')
    if (!category.trim()) return setError('Enter the category')

    const submittedRoom = {
      name: nickName.trim(),
      category: category.trim(),
      isPublic,
      avatar,
    }

    pendingRoomRef.current = submittedRoom
    setIsCreating(true)

    socket.emit('createRoom', submittedRoom)
  }

  return (
    <div className='w-full h-full flex flex-col justify-center items-center'>
      <div className='text-center'>
        <img src={headerText} alt='Header Text' />
      </div>
      <div className='flex flex-col w-[75%] gap-3 mt-10'>
        <div className='relative -space-y-5'>
          <div>
            <img
              src={avatar || avatars[7]}
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
          disabled={isCreating}
          onChange={(e) => {
            setNickname(e.target.value)
            setError('')
          }}
          className='w-full bg-[rgba(255,255,255,0.25)] px-4 py-5 rounded-md border-b-5 border-white focus:outline-0 text-white disabled:opacity-50'
        />
        <input
          type='text'
          placeholder='Category (Animals, famous people, etc.)'
          autoComplete='off'
          value={category}
          disabled={isCreating}
          onChange={(e) => {
            setCategory(e.target.value)
            setError('')
          }}
          className='w-full bg-[rgba(255,255,255,0.25)] px-4 py-5 rounded-md border-b-5 border-white focus:outline-0 text-white disabled:opacity-50'
        />
        <div className='flex items-center gap-3 text-white cursor-pointer select-none py-1'>
          <input
            type='checkbox'
            id='publicCheck'
            checked={isPublic}
            disabled={isCreating}
            onChange={(e) => setIsPublic(e.target.checked)}
            className='w-6 h-6 accent-primary rounded-md text-white cursor-pointer'
          />
          <label
            htmlFor='publicCheck'
            className='cursor-pointer text-sm font-medium'
          >
            Public Room (Visible online)
          </label>
        </div>
        <ErrorMessage message={error} />
        <button
          className='primary-btn disabled:opacity-50'
          onClick={handleCreate}
          disabled={!nickName.trim() || !category.trim() || isCreating}
        >
          {isCreating ? 'creating...' : 'create'}
        </button>
      </div>
    </div>
  )
}

export default Character
