import React from 'react'
import { useNavigate } from 'react-router'

const RoomCard = ({ avatar, name, category, noPlayers, code }) => {
  const navigate = useNavigate()

  return (
    <div
      className='flex items-center justify-between border border-gray-200 p-3 rounded-md hover:bg-gray-200/2x0 cursor-pointer bg-gray-200/10'
      onClick={() => navigate(`/join-online?code=${code}`)}
    >
      <div className='flex items-center gap-5'>
        <img src={avatar} className='w-15 h-15' />
        <div>
          <h2>{name}</h2>
          <h2 className='text-gray-300 text-sm font-light'>{category}</h2>
        </div>
      </div>
      <p className='text-sm'>{noPlayers}/2</p>
    </div>
  )
}

export default RoomCard
