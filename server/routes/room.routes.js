import express from 'express'
import {
  createRoomHTTP,
  getRooms,
  getRoomByCodeOrId,
  updateRoom,
  deleteRoom,
} from '../controller/room.controller.js'

const router = express.Router()

router.post('/', createRoomHTTP)
router.get('/', getRooms)
router.get('/:identifier', getRoomByCodeOrId)
router.put('/:identifier', updateRoom)
router.patch('/:identifier', updateRoom)
router.delete('/:identifier', deleteRoom)

export default router
