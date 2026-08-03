import mongoose from 'mongoose'

const playerSubSchema = new mongoose.Schema(
  {
    socketId: { type: String },
    name: { type: String },
    pfp: { type: String },
  },
  { _id: false },
)

const roomSchema = new mongoose.Schema(
  {
    playerOne: {
      type: playerSubSchema,
      required: true,
    },
    playerTwo: {
      type: playerSubSchema,
    },
    code: { type: Number, required: true, unique: true },
    numberOfPlayer: { type: Number, default: 1 },
    category: { type: String, required: true },
    isPublic: { type: Boolean },
    isStarted: { type: Boolean, default: false },
  },
  { timestamps: true },
)

export const Room = mongoose.models.Room || mongoose.model('Room', roomSchema)
