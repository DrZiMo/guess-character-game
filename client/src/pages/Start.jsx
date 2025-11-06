import headerText from '/Guess Character.png'
import { useNavigate } from 'react-router'

const Start = () => {
  const navigate = useNavigate()

  return (
    <div className='w-full h-full flex flex-col justify-center items-center'>
      <div className='text-center'>
        <img src={headerText} alt='Header Text' />
      </div>
      <div className='flex flex-col w-[75%] gap-3 mt-10'>
        <button
          className='primary-btn'
          onClick={() => navigate('/character?t=create')}
        >
          create
        </button>
        <button className='secondary-btn' onClick={() => navigate('/join')}>
          join
        </button>
      </div>
    </div>
  )
}

export default Start
