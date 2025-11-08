import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const AvatarPicker = ({ onSelect, show, setShow, avatars }) => {
  const pickerRef = useRef(null)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShow(false)
      }
    }

    if (show) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [show, setShow])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            ref={pickerRef}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className='grid grid-cols-4 gap-3 bg-white w-[90%] p-5 rounded-2xl shadow-xl'
          >
            {avatars.map((avatar, i) => (
              <motion.img
                key={i}
                src={avatar}
                alt={`Avatar ${i}`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setSelected(avatar)
                  onSelect(avatar)
                  setShow(false)
                }}
                className={`w-20 h-20 rounded-full cursor-pointer border-2 transition ${
                  selected === avatar ? 'border-blue-500' : 'border-transparent'
                }`}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default AvatarPicker
