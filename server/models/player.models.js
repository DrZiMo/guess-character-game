import mongoose from 'mongoose'

const playerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    pfp: { type: String, required: true },
    numberOfGames: { type: Number, default: 0 },
    browserId: {
      type: String,
      required: true,
      unique: true,
    },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date },
  },
  { timestamps: true },
)

export const Player =
  mongoose.models.Player || mongoose.model('Player', playerSchema)
