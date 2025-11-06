import { create } from 'zustand'

export const useGameStore = create((set) => ({
  roomCode: '',
  name: '',
  isCreator: false,
  img: '',
  players: [],

  setCode: (code) => set({ roomCode: code }),
  setName: (name) => set({ name }),
  setIsCreator: (value) => set({ isCreator: value }),
  setImg: (img) => set({ img }),
  setPlayers: (players) => set({ players }),
}))
