import { generateCode } from '../lib/index.js'
import { Player } from '../models/player.models.js'
import { Room } from '../models/rooms.models.js'

export const createRoom = async (
  io,
  socket,
  { name, avatar, category, isPublic },
) => {
  try {
    let room

    const player = await Player.create({
        name,
        pfp: avatar,  
    })

    while (!room) {
      try {
        let code

        do {
          code = generateCode()
        } while (await Room.exists({ code }))

        room = await Room.create({
          playerOneId: socket.playerId,
          code,
          category,
          isPublic,
        })

        console.log('room created')
      } catch (err) {
        if (err.code !== 11000) throw err
      }
    }

    socket.join(room._id.toString())

    socket.emit('roomCreated', room)
  } catch (err) {
    socket.emit('roomCreationFailed')
  }
}
