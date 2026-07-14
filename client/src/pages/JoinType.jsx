import { useNavigate } from 'react-router'
import { avatars } from '../constants'
import headerText from '/Join.png'
import RoomCard from '../components/RoomCard'

const JoinType = () => {
  const navigate = useNavigate()

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

        <h2 className='mt-6 text-lg'>Online Rooms</h2>

        <div className='mt-2 w-[90%] max-w-full overflow-y-auto space-y-4 flex-1'>
          <RoomCard
            avatar={avatars[8]}
            name={'Zuhaib.pro'}
            category={'Anime'}
            noPlayers={1}
            code={8890}
          />
          <RoomCard
            avatar={avatars[2]}
            name={'faysal'}
            category={'players'}
            noPlayers={1}
          />
          <RoomCard
            avatar={avatars[2]}
            name={'faysal'}
            category={'players'}
            noPlayers={1}
          />
        </div>
      </div>
    </div>
  )
}

export default JoinType
