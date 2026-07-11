import express from 'express'
import { Server } from 'socket.io'
import http from 'http'
import { generateCode } from './lib/index.js'
import { Player } from './models/player.models.js'

const app = express()
const server = http.createServer(app)

const io = new Server(server, {
  cors: { origin: ['http://localhost:5175', 'https://guess-bice.vercel.app'] },
})

const rooms = {}

io.on('connection', (socket) => {
  // register
  socket.on('register', async ({ browserId }) => {
    const player = await Player.findOneAndUpdate(
      { browserId },
      { isOnline: true },
      { new: true },
    )

    socket.playerId = player._id

    io.emit('playerStatusChanged', {
      playerId: player._id,
      isOnline: true,
    })
  })

  // create room
  socket.on('createRoom', async ({ category }) => {
    try {
      let code

      do {
        code = generateCode()
      } while (await Room.findOne({ code }))

      const room = await Room.create({
        playerOneId: socket.playerId,
        code,
        category,
      })

      rooms[code] = {
        roomId: room._id,
        creatorSocketId: socket.id,
        players: [
          {
            playerId: socket.playerId,
            socketId: socket.id,
            word: null,
          },
        ],
        started: false,
      }

      socket.join(room._id.toString())

      socket.emit('roomCreated', {
        roomId: room._id,
        code,
      })
    } catch (error) {
      console.error(error)
      socket.emit('roomCreationFailed')
    }
  })

  // join room
  socket.on('joinRoom', async ({ code, playerId }) => {
    const dbRoom = await Room.findOne({ code })

    if (!dbRoom) {
      return socket.emit('roomNotFound')
    }

    if (dbRoom.playerTwoId) {
      return socket.emit('roomFull')
    }

    dbRoom.playerTwoId = playerId
    dbRoom.numberOfPlayer = 2

    await dbRoom.save()

    rooms[code].players.push({
      playerId,
      socketId: socket.id,
      word: null,
    })

    socket.join(room._id.toString())

    io.to(code.toString()).emit('playerJoined', rooms[code].players)
  })

  // start the game 👉 only the creator of the room
  socket.on('gameStart', (code) => {
    const room = rooms[code]

    room.started = true
    io.to(code).emit('gameStarted')
  })

  socket.on('startClicked', (code) => {
    const room = rooms[code]
    if (
      room &&
      room.creatorSocketId === socket.id &&
      room.players.length === 2
    ) {
      io.to(code).emit('enterWords', room.players)
    }
  })

  // submit the words
  socket.on('submitWord', ({ code, word }) => {
    const room = rooms[code]
    if (!room) return

    const player = room.players.find((p) => p.socketId === socket.id)
    if (player) player.word = word.trim().toLowerCase()

    // check if both words are set
    if (room.players.every((p) => p.word)) {
      const [p1, p2] = room.players

      if (p1.word === p2.word) {
        room.players.forEach((p) => (p.word = null))
        io.to(code).emit('sameWordError')
        return
      }

      io.to(code).emit('wordsSet', room.players)
    }
  })

  // restart game
  socket.on('restartGame', (code) => {
    const room = rooms[code]
    if (!room) return

    room.players.forEach((player) => (player.word = null))
    room.started = true
    io.to(code).emit('gameRestarted')
  })

  // end game
  socket.on('endGame', (code) => {
    const room = rooms[code]
    if (!room) return

    room.players.forEach((player) => (player.word = null))
    room.started = false
    io.to(code).emit('gameEnded')
  })

  // leave the room
  socket.on('leaveRoom', (code) => {
    const room = rooms[code]
    if (!room) return

    const index = room.players.findIndex((p) => p.socketId === socket.id)
    if (index !== -1) {
      const name = room.players[index].name
      room.players.splice(index, 1)
      socket.leave(code)
      io.to(code).emit('playerLeft', name)
    }

    // close the room if the creator leaves
    if (room.creatorSocketId === socket.id) {
      io.to(code).emit('roomClosed')
      delete rooms[code]
    }
  })

  // player want to see result
  socket.on('seeResult', (code) => {
    const room = rooms[code]
    if (!room) return

    room.started = false

    io.to(code).emit('playerSurrend', socket.id)
  })

  // reveal words
  socket.on('confirmReveal', (code) => {
    const room = rooms[code]
    if (!room) return

    io.to(code).emit('revealResult')
  })

  // send message
  socket.on('sendMessage', async ({ roomId, text }) => {
    try {
      const message = await Message.create({
        roomId,
        senderId: socket.playerId,
        text,
      })

      const populatedMessage = await Message.findById(message._id).populate(
        'senderId',
      )

      io.to(roomId.toString()).emit('newMessage', populatedMessage)
    } catch (error) {
      console.log(error)
    }
  })

  // load message
  socket.on('loadMessages', async ({ roomId }) => {
    const messages = await Message.find({
      roomId,
    })
      .populate('senderId')
      .sort({ createdAt: 1 })

    socket.emit('messagesLoaded', messages)
  })

  // disconnect
  socket.on('disconnect', async () => {
    if (!socket.playerId) return

    await Player.findByIdAndUpdate(socket.playerId, {
      isOnline: false,
      lastSeen: new Date(),
    })
    io.emit('playerStatusChanged', {
      playerId: socket.playerId,
      isOnline: false,
    })

    for (const [code, room] of Object.entries(rooms)) {
      if (room.creatorSocketId === socket.id) {
        io.to(code).emit('roomClosed')
        delete rooms[code]
      } else {
        const index = room.players.findIndex((p) => p.socketId === socket.id)
        if (index !== -1) {
          const name = room.players[index].name
          room.players.splice(index, 1)
          io.to(code).emit('playerLeft', name)
        }
      }
    }
  })
})

server.listen(3000, () => console.log('listening', 3000))
