import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
      required: true,
    },
    text: { type: String, required: true },
  },
  { timestamps: true },
)

export const Message =
  mongoose.models.Message || mongoose.model('Message', messageSchema)
