import { create } from 'zustand'

export const useGameStore = create((set) => ({
  roomCode: '',
  roomId: '',
  name: '',
  isCreator: false,
  img: '',
  players: [],

  setCode: (code) => set({ roomCode: code }),
  setRoomId: (id) => set({ roomId: id }),
  setName: (name) => set({ name }),
  setIsCreator: (value) => set({ isCreator: value }),
  setImg: (img) => set({ img }),
  setPlayers: (players) => set({ players }),
}))
