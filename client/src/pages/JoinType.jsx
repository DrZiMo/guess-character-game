import { useNavigate } from 'react-router'
import { avatars, backendURL, socket } from '../constants'
import headerText from '/Join.png'
import RoomCard from '../components/RoomCard'
import { useState, useEffect } from 'react'

const JoinType = () => {
  const navigate = useNavigate()
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Request current public rooms list via socket
    socket.emit('getPublicRooms')

    // Listen for real-time room updates
    const handleRoomsList = (roomsData) => {
      if (Array.isArray(roomsData)) {
        setRooms(roomsData)
      }
      setLoading(false)
    }

    socket.on('publicRoomsList', handleRoomsList)

    // HTTP Fallback
    fetch(`${backendURL}/api/rooms?isPublic=true`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setRooms(data.data)
        }
      })
      .catch((err) =>
        console.error('Error fetching online rooms via REST:', err),
      )
      .finally(() => setLoading(false))

    return () => {
      socket.off('publicRoomsList', handleRoomsList)
    }
  }, [])

  return (
    <div className='w-full h-full flex flex-col justify-center items-center my-22'>
      <div className='text-center'>
        <img src={headerText} alt='Header Text' />
      </div>
      <div className='flex flex-col gap-3 mt-10 w-full h-full items-center text-white'>
        <button
          className='primary-btn w-[75%]!'
          onClick={() => navigate('/join')}
        >
          join with code
        </button>

        <h2 className='mt-6 text-lg font-semibold flex items-center gap-2'>
          <span className='flex items-center gap-2'>
            Real-Time Online Rooms
          </span>
        </h2>

        <div className='mt-2 w-[90%] max-w-full overflow-y-auto space-y-4 flex-1 max-h-80 pr-1 scrollbar-thin scrollbar-thumb-white/20'>
          {loading && rooms.length === 0 ? (
            <div className='text-center mt-6 text-gray-400 animate-pulse'>
              Searching for live rooms...
            </div>
          ) : rooms.length === 0 ? (
            <div className='text-center mt-6 p-4 border border-dashed border-gray-500/50 rounded-lg'>
              <p className='text-gray-300 font-medium'>
                No public rooms available right now!
              </p>
              <p className='text-gray-400 text-xs mt-1'>
                Create one or join with a private code.
              </p>
            </div>
          ) : (
            rooms.map((room) => (
              <RoomCard
                key={room._id || room.code}
                avatar={room.playerOneId?.pfp || avatars[0]}
                name={room.playerOneId?.name || 'Host'}
                category={room.category}
                noPlayers={room.numberOfPlayer || 1}
                code={room.code}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default JoinType
