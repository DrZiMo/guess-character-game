import mongoose from 'mongoose'

const roomSchema = new mongoose.Schema(
  {
    playerOneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
      required: true,
    },
    playerTwoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
    },
    code: { type: Number, required: true, unique: true },
    numberOfPlayer: { type: Number, default: 1 },
    isStarted: { type: Boolean, default: false },
  },
  { timestamps: true },
)

export const Room = mongoose.models.Room || mongoose.model('Room', roomSchema)
