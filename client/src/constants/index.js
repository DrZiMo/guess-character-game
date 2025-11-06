import { io } from 'socket.io-client'
import { createAvatar } from '@dicebear/core'
import { personas } from '@dicebear/collection'

export const backendURL = 'http://localhost:3000'

export const socket = io(backendURL)

const seeds = [
  'lionKing',
  'starGazer',
  'moonWalker',
  'shadowNinja',
  'pinkStorm',
  'blueKnight',
  'forestElf',
  'iceQueen',
  'fireFist',
  'windRider',
]

export const avatars = seeds.map((seed) =>
  createAvatar(personas, {
    seed,
    backgroundColor: ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf'],
    backgroundType: ['solid'],
    hairColor: ['362c47', '6c4545', 'dee1f5'],
    mouth: ['bigSmile', 'frown', 'smile', 'smirk', 'surprised'],
    radius: 50,
    scale: 100,
  }).toDataUri()
)
