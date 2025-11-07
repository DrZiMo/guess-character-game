import { motion } from 'framer-motion'

const ConfirmModal = ({ open, title, message, onConfirm, onCancel }) => {
  if (!open) return null

  return (
    <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50'>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className='bg-[#1e1e1e] text-white p-6 rounded-2xl shadow-xl w-[90%] max-w-sm'
      >
        <h2 className='text-xl font-semibold mb-2'>{title}</h2>
        <p className='text-gray-300 mb-6'>{message}</p>
        <div className='flex justify-end gap-3'>
          <button
            onClick={onCancel}
            className='px-4 py-2 rounded-xl bg-gray-700 hover:bg-gray-600 transition'
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className='px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 transition'
          >
            Yes
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default ConfirmModal
