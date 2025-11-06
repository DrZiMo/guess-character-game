import { useEffect, useRef, useState } from 'react'

const AvatarPicker = ({ onSelect, show, setShow, avatars }) => {
  const pickerRef = useRef(null)
  const [selected, setSelected] = useState(null)

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShow(false)
      }
    }

    if (show) {
      document.addEventListener('mousedown', handleClickOutside)
    } else {
      document.removeEventListener('mousedown', handleClickOutside)
    }

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [show, setShow])

  return (
    <div
      ref={pickerRef}
      className={`grid grid-cols-4 gap-2 absolute bg-white ${
        show ? 'h-fit p-5' : 'p-0 h-0'
      } transition rounded-md overflow-hidden`}
    >
      {avatars.map((avatar, i) => (
        <img
          key={i}
          src={avatar}
          alt={`Avatar ${i}`}
          onClick={() => {
            setSelected(avatar)
            onSelect(avatar)
            setShow(false)
          }}
          className={`w-22 h-22 rounded-full cursor-pointer transition-all ${
            selected === avatar ? 'scale-110' : 'scale-100'
          }`}
        />
      ))}
    </div>
  )
}

export default AvatarPicker
