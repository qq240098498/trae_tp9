import { create } from 'zustand'
import { api } from '../lib/api'
import type {
  Building,
  Room,
  Worker,
  DormitoryRecord,
} from '../types'

interface DormitoryState {
  buildings: Building[]
  rooms: Room[]
  roomStats: any[]
  beds: any[]
  workers: any[]
  records: DormitoryRecord[]
  overview: any
  loading: boolean
  error: string | null

  fetchBuildings: () => Promise<void>
  fetchRooms: (params?: Record<string, string | number>) => Promise<void>
  fetchRoomStats: () => Promise<void>
  fetchBeds: (params?: Record<string, string | number>) => Promise<void>
  fetchWorkers: (params?: Record<string, string | number>) => Promise<void>
  fetchRecords: (params?: Record<string, string | number>) => Promise<void>
  fetchOverview: () => Promise<void>
  fetchAll: () => Promise<void>

  addBuilding: (data: Partial<Building>) => Promise<void>
  updateBuilding: (id: string, data: Partial<Building>) => Promise<void>
  removeBuilding: (id: string) => Promise<void>

  addRoom: (data: Partial<Room>) => Promise<void>
  updateRoom: (id: string, data: Partial<Room>) => Promise<void>
  removeRoom: (id: string) => Promise<void>

  addWorker: (data: Partial<Worker>) => Promise<void>
  updateWorker: (id: string, data: Partial<Worker>) => Promise<void>
  removeWorker: (id: string) => Promise<void>

  checkIn: (data: { workerId: string; bedId: string; operator?: string; reason?: string }) => Promise<void>
  checkOut: (data: { workerId: string; operator?: string; reason?: string }) => Promise<void>
  transfer: (data: { workerId: string; toBedId: string; operator?: string; reason?: string }) => Promise<void>
}

export const useDormitoryStore = create<DormitoryState>((set, get) => ({
  buildings: [],
  rooms: [],
  roomStats: [],
  beds: [],
  workers: [],
  records: [],
  overview: null,
  loading: false,
  error: null,

  fetchBuildings: async () => {
    set({ loading: true, error: null })
    try {
      const data = await api.getBuildings()
      set({ buildings: data })
    } catch (e: any) {
      set({ error: e.message })
    } finally {
      set({ loading: false })
    }
  },

  fetchRooms: async (params) => {
    set({ loading: true, error: null })
    try {
      const data = await api.getRooms(params)
      set({ rooms: data })
    } catch (e: any) {
      set({ error: e.message })
    } finally {
      set({ loading: false })
    }
  },

  fetchRoomStats: async () => {
    set({ loading: true, error: null })
    try {
      const data = await api.getRoomStats()
      set({ roomStats: data })
    } catch (e: any) {
      set({ error: e.message })
    } finally {
      set({ loading: false })
    }
  },

  fetchBeds: async (params) => {
    set({ loading: true, error: null })
    try {
      const data = await api.getBeds(params)
      set({ beds: data })
    } catch (e: any) {
      set({ error: e.message })
    } finally {
      set({ loading: false })
    }
  },

  fetchWorkers: async (params) => {
    set({ loading: true, error: null })
    try {
      const data = await api.getWorkers(params)
      set({ workers: data })
    } catch (e: any) {
      set({ error: e.message })
    } finally {
      set({ loading: false })
    }
  },

  fetchRecords: async (params) => {
    set({ loading: true, error: null })
    try {
      const data = await api.getRecords(params)
      set({ records: data })
    } catch (e: any) {
      set({ error: e.message })
    } finally {
      set({ loading: false })
    }
  },

  fetchOverview: async () => {
    set({ loading: true, error: null })
    try {
      const data = await api.getOverview()
      set({ overview: data })
    } catch (e: any) {
      set({ error: e.message })
    } finally {
      set({ loading: false })
    }
  },

  fetchAll: async () => {
    set({ loading: true, error: null })
    try {
      const [buildings, rooms, beds, workers, records, overview] = await Promise.all([
        api.getBuildings(),
        api.getRooms(),
        api.getBeds(),
        api.getWorkers(),
        api.getRecords(),
        api.getOverview(),
      ])
      set({ buildings, rooms, beds, workers, records, overview })
    } catch (e: any) {
      set({ error: e.message })
    } finally {
      set({ loading: false })
    }
  },

  addBuilding: async (data) => {
    await api.createBuilding(data)
    await get().fetchBuildings()
    await get().fetchOverview()
  },

  updateBuilding: async (id, data) => {
    await api.updateBuilding(id, data)
    await get().fetchBuildings()
  },

  removeBuilding: async (id) => {
    await api.deleteBuilding(id)
    await get().fetchBuildings()
    await get().fetchOverview()
  },

  addRoom: async (data) => {
    await api.createRoom(data)
    await get().fetchRooms()
    await get().fetchBeds()
    await get().fetchOverview()
  },

  updateRoom: async (id, data) => {
    await api.updateRoom(id, data)
    await get().fetchRooms()
    await get().fetchRoomStats()
  },

  removeRoom: async (id) => {
    await api.deleteRoom(id)
    await get().fetchRooms()
    await get().fetchBeds()
    await get().fetchOverview()
  },

  addWorker: async (data) => {
    await api.createWorker(data)
    await get().fetchWorkers()
    await get().fetchOverview()
  },

  updateWorker: async (id, data) => {
    await api.updateWorker(id, data)
    await get().fetchWorkers()
  },

  removeWorker: async (id) => {
    await api.deleteWorker(id)
    await get().fetchWorkers()
    await get().fetchOverview()
  },

  checkIn: async (data) => {
    await api.checkIn(data)
    await get().fetchWorkers()
    await get().fetchBeds()
    await get().fetchRecords()
    await get().fetchOverview()
    await get().fetchRoomStats()
  },

  checkOut: async (data) => {
    await api.checkOut(data)
    await get().fetchWorkers()
    await get().fetchBeds()
    await get().fetchRecords()
    await get().fetchOverview()
    await get().fetchRoomStats()
  },

  transfer: async (data) => {
    await api.transfer(data)
    await get().fetchWorkers()
    await get().fetchBeds()
    await get().fetchRecords()
    await get().fetchRoomStats()
  },
}))
