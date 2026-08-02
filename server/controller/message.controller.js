import { Message } from '../models/message.models.js'

// Send / Create a message (HTTP)
export const createMessage = async (req, res) => {
  try {
    const { roomId, senderId, text } = req.body

    if (!roomId || !senderId || !text) {
      return res
        .status(400)
        .json({ error: 'roomId, senderId, and text are required' })
    }

    const message = await Message.create({ roomId, senderId, text })
    const populated = await Message.findById(message._id).populate(
      'senderId',
      'name pfp',
    )

    return res.status(201).json({ success: true, data: populated })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

// Get messages for a given room
export const getMessagesByRoom = async (req, res) => {
  try {
    const { roomId } = req.params

    const messages = await Message.find({ roomId })
      .populate('senderId', 'name pfp')
      .sort({ createdAt: 1 })

    return res.status(200).json({ success: true, data: messages })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

// Delete a single message by ID
export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params

    const message = await Message.findByIdAndDelete(id)
    if (!message) {
      return res.status(404).json({ error: 'Message not found' })
    }

    return res
      .status(200)
      .json({ success: true, message: 'Message deleted successfully' })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

// Delete all messages for a room (bulk delete when room ends or is deleted)
export const deleteRoomMessagesController = async (req, res) => {
  try {
    const { roomId } = req.params

    const result = await Message.deleteMany({ roomId })

    return res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} messages for room ${roomId}`,
      deletedCount: result.deletedCount,
    })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
