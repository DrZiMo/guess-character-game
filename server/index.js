import express from 'express'
import { Server } from 'socket.io'
import http from 'http'
import { generateCode } from './lib/index.js'

const app = express()
const server = http.createServer(app)

const io = new Server(server, { cors: { origin: 'http://localhost:5175' } })

const rooms = {}

io.on('connection', (socket) => {
  // create room
  socket.on('createRoom', ({ name, avatar }) => {
    let code
    do code = generateCode()
    while (rooms[code])

    rooms[code] = {
      creatorId: socket.id,
      players: [{ id: socket.id, name, word: null, avatar }],
      started: false,
    }
    socket.join(code)

    socket.emit('roomCreated', code)
  })

  // join room
  socket.on('joinRoom', ({ code, name, avatar }) => {
    const room = rooms[code]

    if (!room) return socket.emit('roomNotFound')
    if (room.players.length == 2) return socket.emit('roomFull')

    room.players.push({ id: socket.id, name, avatar, word: null })

    socket.join(code)

    // Notify players
    io.to(code).emit('playerJoined', room.players)
  })

  // start the game 👉 only the creator of the room
  socket.on('gameStart', (code) => {
    const room = rooms[code]

    room.started = true
    io.to(code).emit('gameStarted')
  })

  socket.on('startClicked', (code) => {
    const room = rooms[code]
    if (room && room.creatorId === socket.id && room.players.length === 2) {
      io.to(code).emit('enterWords', room.players)
    }
  })

  // submit the words
  socket.on('submitWord', ({ code, word }) => {
    const room = rooms[code]
    if (!room) return

    const player = room.players.find((p) => p.id === socket.id)
    if (player) player.word = word.trim().toLowerCase()

    // check if both words are set
    if (room.players.every((p) => p.word)) {
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

    const index = room.players.findIndex((p) => p.id === socket.id)
    if (index !== -1) {
      const name = room.players[index].name
      room.players.splice(index, 1)
      socket.leave(code)
      io.to(code).emit('playerLeft', name)
    }

    // close the room if the creator leaves
    if (room.creatorId === socket.id) {
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

  // disconnect
  socket.on('disconnect', () => {
    for (const [code, room] of Object.entries(rooms)) {
      if (room.creatorId === socket.id) {
        io.to(code).emit('roomClosed')
        delete rooms[code]
      } else {
        const index = room.players.findIndex((p) => p.id === socket.id)
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
