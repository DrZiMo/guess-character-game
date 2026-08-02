import { generateCode } from '../lib/index.js'
import { Player } from '../models/player.models.js'
import { Room } from '../models/rooms.models.js'
import { Message } from '../models/message.models.js'

// Helper function to cleanup all messages of a room
export const deleteRoomMessages = async (roomId) => {
  try {
    if (!roomId) return
    await Message.deleteMany({ roomId })
  } catch (error) {
    console.error('Failed to delete room messages:', error)
  }
}

// Broadcast public available rooms to all connected clients via Socket.io
export const broadcastPublicRooms = async (io) => {
  try {
    const publicRooms = await Room.find({
      isPublic: true,
      numberOfPlayer: 1,
      isStarted: false,
    })
      .populate('playerOneId', 'name pfp')
      .sort({ createdAt: -1 })

    io.emit('publicRoomsList', publicRooms)
  } catch (error) {
    console.error('Error broadcasting public rooms:', error)
  }
}

// HTTP: Create Room
export const createRoomHTTP = async (req, res) => {
  try {
    const { playerOneId, category, isPublic } = req.body

    if (!playerOneId || !category) {
      return res
        .status(400)
        .json({ error: 'playerOneId and category are required' })
    }

    let room
    while (!room) {
      try {
        let code
        do {
          code = generateCode()
        } while (await Room.exists({ code }))

        room = await Room.create({
          playerOneId,
          code,
          category,
          isPublic: isPublic ?? true,
        })
      } catch (err) {
        if (err.code !== 11000) throw err
      }
    }

    return res.status(201).json({ success: true, data: room })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

// HTTP: Get all public/active rooms
export const getRooms = async (req, res) => {
  try {
    const { isPublic, category } = req.query
    const query = {}

    if (isPublic !== undefined) query.isPublic = isPublic === 'true'
    if (category) query.category = category

    const rooms = await Room.find(query)
      .populate('playerOneId', 'name pfp')
      .populate('playerTwoId', 'name pfp')
      .sort({ createdAt: -1 })

    return res.status(200).json({ success: true, data: rooms })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

// HTTP: Get room by Code or ID
export const getRoomByCodeOrId = async (req, res) => {
  try {
    const { identifier } = req.params
    let room

    if (!isNaN(identifier)) {
      room = await Room.findOne({ code: Number(identifier) })
    } else {
      room = await Room.findById(identifier)
    }

    if (!room) {
      return res.status(404).json({ error: 'Room not found' })
    }

    await room.populate('playerOneId', 'name pfp')
    await room.populate('playerTwoId', 'name pfp')

    return res.status(200).json({ success: true, data: room })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

// HTTP: Update / Edit Room
export const updateRoom = async (req, res) => {
  try {
    const { identifier } = req.params
    const updates = req.body

    let room
    if (!isNaN(identifier)) {
      room = await Room.findOneAndUpdate(
        { code: Number(identifier) },
        updates,
        {
          new: true,
          runValidators: true,
        },
      )
    } else {
      room = await Room.findByIdAndUpdate(identifier, updates, {
        new: true,
        runValidators: true,
      })
    }

    if (!room) {
      return res.status(404).json({ error: 'Room not found' })
    }

    return res.status(200).json({ success: true, data: room })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

// HTTP & Controller: Delete Room and clean up room messages
export const deleteRoom = async (req, res) => {
  try {
    const { identifier } = req.params
    let room

    if (!isNaN(identifier)) {
      room = await Room.findOneAndDelete({ code: Number(identifier) })
    } else {
      room = await Room.findByIdAndDelete(identifier)
    }

    if (!room) {
      return res.status(404).json({ error: 'Room not found' })
    }

    // Delete associated messages when room is deleted
    await deleteRoomMessages(room._id)

    return res.status(200).json({
      success: true,
      message: 'Room and its messages deleted successfully',
      data: room,
    })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
