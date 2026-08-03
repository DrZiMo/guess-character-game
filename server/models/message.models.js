import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    },
    sender: {
      socketId: { type: String, required: true },
      name: { type: String },
      pfp: { type: String },
    },
    text: { type: String, required: true },
  },
  { timestamps: true },
)

export const Message =
  mongoose.models.Message || mongoose.model('Message', messageSchema)
