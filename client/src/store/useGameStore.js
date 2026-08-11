import { create } from 'zustand'

export const useGameStore = create((set) => ({
  roomCode: '',
  roomId: '',
  name: '',
  category: '',
  isCreator: false,
  img: '',
  players: [],

  setCode: (code) => set({ roomCode: code }),
  setRoomId: (id) => set({ roomId: id }),
  setCategory: (category) => set({ category }),
  setName: (name) => set({ name }),
  setIsCreator: (value) => set({ isCreator: value }),
  setImg: (img) => set({ img }),
  setPlayers: (players) => set({ players }),

  resetAll: () =>
    set({
      roomCode: '',
      roomId: '',
      name: '',
      category: '',
      isCreator: false,
      img: '',
      players: [],
    }),
}))
