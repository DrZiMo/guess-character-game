import express from 'express'
import { Server } from 'socket.io'
import http from 'http'
import dotenv from 'dotenv'

import { connectDB } from './utils/db.js'
import { Player } from './models/player.models.js'
import { Room } from './models/rooms.models.js'
import { Message } from './models/message.models.js'
import { generateCode } from './lib/index.js'

import {
  deleteRoomMessages,
  broadcastPublicRooms,
  closeAndDeleteRoom,
} from './controller/room.controller.js'

import roomRoutes from './routes/room.routes.js'
import userRoutes from './routes/user.routes.js'
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
app.use('/api/users', userRoutes)
app.use('/api/messages', messageRoutes)

connectDB()

const rooms = {}

io.on('connection', (socket) => {
  // Register player
  socket.on('register', async ({ browserId }) => {
    try {
      if (!browserId) return
      const player = await Player.findOneAndUpdate(
        { browserId },
        { $set: { isOnline: true } },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      )
      socket.playerId = player._id
      socket.browserId = browserId
      socket.emit('registered', { playerId: player._id })
      io.emit('playerStatusChanged', { playerId: player._id, isOnline: true })
    } catch (error) {
      console.error('Error registering socket player:', error)
    }
  })

  // Get available public rooms (real-time request)
  socket.on('getPublicRooms', async () => {
    try {
      const publicRooms = await Room.find({
        isPublic: true,
        numberOfPlayer: 1,
        isStarted: false,
      })
        .populate('playerOneId', 'name pfp')
        .sort({ createdAt: -1 })

      socket.emit('publicRoomsList', publicRooms)
    } catch (error) {
      console.error('Error sending public rooms:', error)
    }
  })

  // Create Room
  socket.on('createRoom', async ({ name, avatar, category, isPublic }) => {
    try {
      let player
      if (socket.playerId) {
        player = await Player.findById(socket.playerId)
      }

      if (!player) {
        player = await Player.create({
          name: name || 'Player 1',
          pfp: avatar || 'default_avatar.png',
          browserId: socket.id,
        })
        socket.playerId = player._id
      } else {
        if (name) player.name = name
        if (avatar) player.pfp = avatar
        await player.save()
      }

      let dbRoom
      while (!dbRoom) {
        try {
          let code
          do {
            code = generateCode()
          } while (await Room.exists({ code }))

          dbRoom = await Room.create({
            playerOneId: player._id,
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
        playerId: player._id.toString(),
        name: player.name,
        avatar: player.pfp,
        pfp: player.pfp,
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
  socket.on('joinRoom', async ({ code, name, avatar, playerId }) => {
    try {
      if (!code) {
        return socket.emit('roomNotFound')
      }

      const numericCode = Number(code.toString().trim())
      if (isNaN(numericCode)) {
        return socket.emit('roomNotFound')
      }

      const dbRoom = await Room.findOne({ code: numericCode }).populate(
        'playerOneId',
      )

      if (!dbRoom) {
        return socket.emit('roomNotFound')
      }

      if (dbRoom.numberOfPlayer >= 2 && dbRoom.playerTwoId) {
        return socket.emit('roomFull')
      }

      let playerTwo
      if (playerId) {
        playerTwo = await Player.findById(playerId)
      }
      if (!playerTwo) {
        playerTwo = await Player.create({
          name: name || 'Player 2',
          pfp: avatar || 'default_avatar.png',
          browserId: socket.id,
        })
      } else {
        if (name) playerTwo.name = name
        if (avatar) playerTwo.pfp = avatar
        await playerTwo.save()
      }

      socket.playerId = playerTwo._id

      const claimed = await Room.findOneAndUpdate(
        {
          code: numericCode,
          $or: [{ playerTwoId: { $exists: false } }, { playerTwoId: null }],
        },
        { $set: { playerTwoId: playerTwo._id, numberOfPlayer: 2 } },
        { new: true },
      )

      if (!claimed) {
        return socket.emit('roomFull')
      }

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

      if (rooms[numericCode].players.length === 0 && dbRoom.playerOneId) {
        rooms[numericCode].players.push({
          id: dbRoom.playerOneId.browserId || 'creator',
          socketId: rooms[numericCode].creatorSocketId,
          playerId: dbRoom.playerOneId._id.toString(),
          name: dbRoom.playerOneId.name,
          avatar: dbRoom.playerOneId.pfp,
          pfp: dbRoom.playerOneId.pfp,
          word: null,
        })
      }

      const playerTwoObj = {
        id: socket.id,
        socketId: socket.id,
        playerId: playerTwo._id.toString(),
        name: playerTwo.name,
        avatar: playerTwo.pfp,
        pfp: playerTwo.pfp,
        word: null,
      }

      const existingIndex = rooms[numericCode].players.findIndex(
        (p) =>
          p.socketId === socket.id ||
          (p.playerId && p.playerId === playerTwo._id.toString()),
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
      // If playerTwo leaves, reset database player count to 1
      try {
        await Room.findOneAndUpdate(
          { code: numericCode },
          { numberOfPlayer: 1, $unset: { playerTwoId: 1 } },
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
      if (!socket.playerId)
        return socket.emit('messageFailed', 'Not registered')

      let activeRoomId = roomId
      if (!isNaN(roomId)) {
        const foundRoom = await Room.findOne({ code: Number(roomId) })
        if (foundRoom) activeRoomId = foundRoom._id
      }

      if (!socket.rooms.has(activeRoomId.toString())) return

      const message = await Message.create({
        roomId: activeRoomId,
        senderId: socket.playerId,
        text: text.trim().slice(0, 1000),
      })

      const populatedMessage = await Message.findById(message._id).populate(
        'senderId',
        'name pfp',
      )

      io.to(activeRoomId.toString()).emit('newMessage', populatedMessage)
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

      const messages = await Message.find({ roomId: activeRoomId })
        .populate('senderId', 'name pfp')
        .sort({ createdAt: 1 })

      socket.emit('messagesLoaded', messages)
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  })

  // Disconnect -> Deletes room from database when creator disconnects or room becomes empty
  socket.on('disconnect', async () => {
    if (socket.playerId) {
      try {
        await Player.findByIdAndUpdate(socket.playerId, {
          isOnline: false,
          lastSeen: new Date(),
        })
        io.emit('playerStatusChanged', {
          playerId: socket.playerId,
          isOnline: false,
        })
      } catch (err) {
        console.error('Error updating player status on disconnect:', err)
      }
    }

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
                { numberOfPlayer: 1, $unset: { playerTwoId: 1 } },
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
