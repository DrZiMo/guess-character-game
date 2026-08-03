import express from 'express'
import {
  createMessage,
  getMessagesByRoom,
  deleteMessage,
  deleteRoomMessagesController,
} from '../controller/message.controller.js'

const router = express.Router()

router.post('/', createMessage)
router.get('/room/:roomId', getMessagesByRoom)
router.delete('/:id', deleteMessage)
router.delete('/room/:roomId', deleteRoomMessagesController)

export default router
