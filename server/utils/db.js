import dotenv from 'dotenv'
import mongoose from 'mongoose'
dotenv.config()

const MONGO_URI = process.env.MONGODB_URL

export const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI)
    console.log('✅ MongoDB connected')
  } catch (error) {
    console.error('❌ Connection error:', error)
    process.exit(1)
  }
}
