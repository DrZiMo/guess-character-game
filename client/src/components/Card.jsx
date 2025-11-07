import React from 'react'

const Card = ({ text, flip }) => {
  return (
    <div
      className={`border border-white ${
        flip ? 'bg-linear-to-t' : 'bg-linear-to-b'
      } from-[rgba(255,255,255,0.4)] to-transparent w-[200px] min-h-[100px] p-3 rounded-md flex justify-center items-center ${
        text === 'none' ? 'text-2xl' : ''
      }`}
    >
      {text === 'none' ? '?' : text}
    </div>
  )
}

export default Card
