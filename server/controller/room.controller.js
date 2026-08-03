import { generateCode } from '../lib/index.js'
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

// Build the visible public-room list for clients
export const getPublicRoomsList = async () => {
  const publicRooms = await Room.find({
    isPublic: true,
    numberOfPlayer: 1,
    isStarted: false,
  }).sort({ createdAt: -1 })

  return publicRooms
}

// Broadcast public available rooms to all connected clients via Socket.io
export const broadcastPublicRooms = async (io) => {
  try {
    if (!io) return
    const publicRooms = await getPublicRoomsList()
    io.emit('publicRoomsList', publicRooms)
  } catch (error) {
    console.error('Error broadcasting public rooms:', error)
  }
}

// Helper to delete room from database & clean up its messages & update public list
export const closeAndDeleteRoom = async (code, io) => {
  try {
    if (!code) return
    const numericCode = Number(code)
    let room
    if (!isNaN(numericCode)) {
      room = await Room.findOneAndDelete({ code: numericCode })
    } else {
      room = await Room.findByIdAndDelete(code)
    }

    if (room) {
      await deleteRoomMessages(room._id)
      console.log(`Deleted room ${code} and its messages from database.`)
    }

    if (io) {
      await broadcastPublicRooms(io)
    }
    return room
  } catch (error) {
    console.error(`Error deleting room ${code} from database:`, error)
  }
}

// HTTP: Create Room
export const createRoomHTTP = async (req, res) => {
  try {
    const { playerOne, category, isPublic } = req.body

    if (!playerOne || !category) {
      return res
        .status(400)
        .json({ error: 'playerOne and category are required' })
    }

    let room
    while (!room) {
      try {
        let code
        do {
          code = generateCode()
        } while (await Room.exists({ code }))

        room = await Room.create({
          playerOne,
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

    const rooms = await Room.find(query).sort({ createdAt: -1 })

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
          returnDocument: 'after',
          runValidators: true,
        },
      )
    } else {
      room = await Room.findByIdAndUpdate(identifier, updates, {
        returnDocument: 'after',
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
    const room = await closeAndDeleteRoom(identifier, req.app.get('io'))

    if (!room) {
      return res.status(404).json({ error: 'Room not found' })
    }

    return res.status(200).json({
      success: true,
      message: 'Room and its messages deleted from database successfully',
      data: room,
    })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
