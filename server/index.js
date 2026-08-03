import express from 'express'
import { Server } from 'socket.io'
import http from 'http'
import dotenv from 'dotenv'

import { connectDB } from './utils/db.js'
import { Room } from './models/rooms.models.js'
import { Message } from './models/message.models.js'
import { generateCode } from './lib/index.js'

import {
  deleteRoomMessages,
  broadcastPublicRooms,
  closeAndDeleteRoom,
  getPublicRoomsList,
} from './controller/room.controller.js'

import roomRoutes from './routes/room.routes.js'
import messageRoutes from './routes/message.routes.js'

dotenv.config()

const app = express()
const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5175',
      'https://guess-bice.vercel.app',
      'http://localhost:5173',
    ],
  },
})

app.set('io', io)
app.use(express.json())

// Mount API routes
app.use('/api/rooms', roomRoutes)
app.use('/api/messages', messageRoutes)

connectDB()

// In-memory rooms map keyed by numeric code
const rooms = {}

io.on('connection', (socket) => {
  // Get available public rooms (real-time request)
  socket.on('getPublicRooms', async () => {
    try {
      const publicRooms = await getPublicRoomsList()
      socket.emit('publicRoomsList', publicRooms)
    } catch (error) {
      console.error('Error sending public rooms:', error)
    }
  })

  // Create Room
  socket.on('createRoom', async ({ name, avatar, category, isPublic }) => {
    try {
      const playerName = name || 'Player 1'
      const playerPfp = avatar || 'default_avatar.png'

      let dbRoom
      while (!dbRoom) {
        try {
          let code
          do {
            code = generateCode()
          } while (await Room.exists({ code }))

          dbRoom = await Room.create({
            playerOne: {
              socketId: socket.id,
              name: playerName,
              pfp: playerPfp,
            },
            code,
            category: category || 'General',
            isPublic: isPublic ?? true,
            numberOfPlayer: 1,
          })
        } catch (err) {
          if (err.code !== 11000) throw err
        }
      }

      const creatorObj = {
        id: socket.id,
        socketId: socket.id,
        name: playerName,
        avatar: playerPfp,
        pfp: playerPfp,
        word: null,
      }

      rooms[dbRoom.code] = {
        roomId: dbRoom._id,
        code: dbRoom.code,
        category: dbRoom.category,
        isPublic: dbRoom.isPublic,
        creatorSocketId: socket.id,
        started: false,
        players: [creatorObj],
      }

      socket.join(dbRoom._id.toString())
      socket.join(dbRoom.code.toString())

      socket.emit('roomCreated', dbRoom)
      broadcastPublicRooms(io)
    } catch (err) {
      console.error('Error in createRoom socket event:', err)
      socket.emit('roomCreationFailed')
    }
  })

  // Join Room
  socket.on('joinRoom', async ({ code, name, avatar }) => {
    try {
      if (!code) return socket.emit('roomNotFound')

      const numericCode = Number(code.toString().trim())
      if (isNaN(numericCode)) return socket.emit('roomNotFound')

      const dbRoom = await Room.findOne({ code: numericCode })
      if (!dbRoom) return socket.emit('roomNotFound')

      if (dbRoom.numberOfPlayer >= 2 && dbRoom.playerTwo) {
        return socket.emit('roomFull')
      }

      const playerTwoName = name || 'Player 2'
      const playerTwoPfp = avatar || 'default_avatar.png'

      const claimed = await Room.findOneAndUpdate(
        {
          code: numericCode,
          $or: [{ playerTwo: { $exists: false } }, { playerTwo: null }],
        },
        {
          $set: {
            playerTwo: {
              socketId: socket.id,
              name: playerTwoName,
              pfp: playerTwoPfp,
            },
            numberOfPlayer: 2,
          },
        },
        { returnDocument: 'after' },
      )

      if (!claimed) return socket.emit('roomFull')

      if (!rooms[numericCode]) {
        rooms[numericCode] = {
          roomId: dbRoom._id,
          code: dbRoom.code,
          category: dbRoom.category,
          isPublic: dbRoom.isPublic,
          creatorSocketId: null,
          started: false,
          players: [],
        }
      }

      if (rooms[numericCode].players.length === 0 && dbRoom.playerOne) {
        rooms[numericCode].players.push({
          id: dbRoom.playerOne.socketId || 'creator',
          socketId:
            dbRoom.playerOne.socketId || rooms[numericCode].creatorSocketId,
          name: dbRoom.playerOne.name,
          avatar: dbRoom.playerOne.pfp,
          pfp: dbRoom.playerOne.pfp,
          word: null,
        })
      }

      const playerTwoObj = {
        id: socket.id,
        socketId: socket.id,
        name: playerTwoName,
        avatar: playerTwoPfp,
        pfp: playerTwoPfp,
        word: null,
      }

      const existingIndex = rooms[numericCode].players.findIndex(
        (p) => p.socketId === socket.id,
      )

      if (existingIndex !== -1) {
        rooms[numericCode].players[existingIndex] = playerTwoObj
      } else {
        rooms[numericCode].players.push(playerTwoObj)
      }

      socket.join(dbRoom._id.toString())
      socket.join(numericCode.toString())

      socket.emit('roomJoined', {
        code: dbRoom.code,
        roomId: dbRoom._id,
        category: dbRoom.category,
      })

      io.to(numericCode.toString()).emit(
        'playerJoined',
        rooms[numericCode].players,
      )
      broadcastPublicRooms(io)
    } catch (error) {
      console.error('Error in joinRoom socket event:', error)
      socket.emit('roomNotFound')
    }
  })

  // Start game
  socket.on('gameStart', (code) => {
    const numericCode = Number(code)
    const room = rooms[numericCode]
    if (room) {
      room.started = true
      io.to(numericCode.toString()).emit('gameStarted')
      broadcastPublicRooms(io)
    }
  })

  socket.on('startClicked', (code) => {
    const numericCode = Number(code)
    const room = rooms[numericCode]
    if (
      room &&
      (room.creatorSocketId === socket.id || room.players.length === 2)
    ) {
      io.to(numericCode.toString()).emit('enterWords', room.players)
    }
  })

  // Submit word
  socket.on('submitWord', ({ code, word }) => {
    const numericCode = Number(code)
    const room = rooms[numericCode]
    if (!room) return

    if (typeof word !== 'string' || !word.trim()) return

    const player = room.players.find((p) => p.socketId === socket.id)
    if (player) player.word = word.trim().toLowerCase()

    if (room.players.length === 2 && room.players.every((p) => p.word)) {
      const [p1, p2] = room.players

      if (p1.word === p2.word) {
        room.players.forEach((p) => (p.word = null))
        io.to(numericCode.toString()).emit('sameWordError')
        return
      }

      io.to(numericCode.toString()).emit('wordsSet', room.players)
    }
  })

  // Restart game
  socket.on('restartGame', (code) => {
    const numericCode = Number(code)
    const room = rooms[numericCode]
    if (!room) return

    room.players.forEach((player) => (player.word = null))
    room.started = true
    io.to(numericCode.toString()).emit('gameRestarted')
  })

  // End game -> Deletes room & purges all messages from database
  socket.on('endGame', async (code) => {
    const numericCode = Number(code)
    const room = rooms[numericCode]

    if (!room || !room.players.some((p) => p.socketId === socket.id)) return

    if (room) {
      room.players.forEach((player) => (player.word = null))
      room.started = false
      io.to(numericCode.toString()).emit('gameEnded')
    }

    await closeAndDeleteRoom(numericCode, io)
    delete rooms[numericCode]
  })

  // Leave room -> Deletes room from database if creator leaves or room empty
  socket.on('leaveRoom', async (code) => {
    const numericCode = Number(code)
    const room = rooms[numericCode]
    if (!room) return

    const index = room.players.findIndex((p) => p.socketId === socket.id)
    if (index !== -1) {
      const name = room.players[index].name
      room.players.splice(index, 1)
      socket.leave(numericCode.toString())
      io.to(numericCode.toString()).emit('playerLeft', name)
    }

    if (room.creatorSocketId === socket.id || room.players.length === 0) {
      io.to(numericCode.toString()).emit('roomClosed')
      await closeAndDeleteRoom(numericCode, io)
      delete rooms[numericCode]
    } else {
      // If playerTwo leaves, reset database player count to 1 and remove playerTwo
      try {
        await Room.findOneAndUpdate(
          { code: numericCode },
          { numberOfPlayer: 1, $unset: { playerTwo: 1 } },
        )
        broadcastPublicRooms(io)
      } catch (err) {
        console.error('Error updating room on player leave:', err)
      }
    }
  })

  // See result
  socket.on('seeResult', (code) => {
    const numericCode = Number(code)
    const room = rooms[numericCode]
    if (!room) return

    room.started = false
    io.to(numericCode.toString()).emit('playerSurrend', socket.id)
  })

  // Reveal result
  socket.on('confirmReveal', (code) => {
    const numericCode = Number(code)
    const room = rooms[numericCode]
    if (!room) return

    io.to(numericCode.toString()).emit('revealResult')
  })

  // Send message
  socket.on('sendMessage', async ({ roomId, text }) => {
    try {
      if (!roomId || typeof text !== 'string' || !text.trim()) return

      let activeRoomId = roomId
      if (!isNaN(roomId)) {
        const foundRoom = await Room.findOne({ code: Number(roomId) })
        if (foundRoom) activeRoomId = foundRoom._id
      }

      if (!socket.rooms.has(activeRoomId.toString())) return

      // Determine sender info from in-memory rooms
      let sender = {
        socketId: socket.id,
        name: 'Player',
        pfp: 'default_avatar.png',
      }
      const numericCode = Number(roomId)
      const inMemoryRoom =
        rooms[numericCode] ||
        Object.values(rooms).find(
          (r) => r.roomId?.toString() === activeRoomId.toString(),
        )
      if (inMemoryRoom) {
        const player = inMemoryRoom.players.find(
          (p) => p.socketId === socket.id,
        )
        if (player)
          sender = {
            socketId: player.socketId,
            name: player.name,
            pfp: player.pfp,
          }
      }

      const message = await Message.create({
        roomId: activeRoomId,
        sender,
        text: text.trim().slice(0, 1000),
      })

      io.to(activeRoomId.toString()).emit('newMessage', message)
    } catch (error) {
      console.error('Error sending message:', error)
    }
  })

  // Load messages
  socket.on('loadMessages', async ({ roomId }) => {
    try {
      if (!roomId) return

      let activeRoomId = roomId
      if (!isNaN(roomId)) {
        const foundRoom = await Room.findOne({ code: Number(roomId) })
        if (foundRoom) activeRoomId = foundRoom._id
      }

      const messages = await Message.find({ roomId: activeRoomId }).sort({
        createdAt: 1,
      })

      socket.emit('messagesLoaded', messages)
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  })

  // Disconnect -> Deletes room from database when creator disconnects or room becomes empty
  socket.on('disconnect', async () => {
    for (const [code, room] of Object.entries(rooms)) {
      const numericCode = Number(code)
      if (room.creatorSocketId === socket.id) {
        io.to(code).emit('roomClosed')
        await closeAndDeleteRoom(numericCode, io)
        delete rooms[code]
      } else {
        const index = room.players.findIndex((p) => p.socketId === socket.id)
        if (index !== -1) {
          const name = room.players[index].name
          room.players.splice(index, 1)
          io.to(code).emit('playerLeft', name)

          if (room.players.length === 0) {
            await closeAndDeleteRoom(numericCode, io)
            delete rooms[code]
          } else {
            try {
              await Room.findOneAndUpdate(
                { code: numericCode },
                { numberOfPlayer: 1, $unset: { playerTwo: 1 } },
              )
              broadcastPublicRooms(io)
            } catch (err) {
              console.error('Error updating room on disconnect:', err)
            }
          }
        }
      }
    }
  })
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => console.log(`Server running on port ${PORT}`))
