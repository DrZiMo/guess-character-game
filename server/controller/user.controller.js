import { Player } from '../models/player.models.js'

// Register or create a user/player
export const createUser = async (req, res) => {
  try {
    const { name, pfp, browserId } = req.body

    if (!browserId) {
      return res.status(400).json({ error: 'browserId is required' })
    }

    let player = await Player.findOne({ browserId })

    if (player) {
      if (name) player.name = name
      if (pfp) player.pfp = pfp
      player.isOnline = true
      await player.save()
    } else {
      player = await Player.create({
        name: name || 'Anonymous',
        pfp: pfp || 'default_avatar.png',
        browserId,
        isOnline: true,
      })
    }

    return res.status(200).json({ success: true, data: player })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

// Get all users
export const getUsers = async (req, res) => {
  try {
    const users = await Player.find().sort({ createdAt: -1 })
    return res.status(200).json({ success: true, data: users })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

// Get user by ID or browserId
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params
    let user = await Player.findById(id)

    if (!user) {
      user = await Player.findOne({ browserId: id })
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    return res.status(200).json({ success: true, data: user })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

// Update user details
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body

    const user = await Player.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    return res.status(200).json({ success: true, data: user })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params
    const user = await Player.findByIdAndDelete(id)

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    return res
      .status(200)
      .json({ success: true, message: 'User deleted successfully' })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
