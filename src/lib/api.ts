import type {
  Building,
  Room,
  Bed,
  Worker,
  DormitoryRecord,
} from '../types'

const BASE_URL = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const json = await res.json()
  if (!json.success) {
    throw new Error(json.error || '请求失败')
  }
  return json.data as T
}

export const api = {
  getBuildings: () => request<Building[]>('/buildings'),
  getBuilding: (id: string) => request<Building>(`/buildings/${id}`),
  createBuilding: (data: Partial<Building>) =>
    request<Building>('/buildings', { method: 'POST', body: JSON.stringify(data) }),
  updateBuilding: (id: string, data: Partial<Building>) =>
    request<Building>(`/buildings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBuilding: (id: string) =>
    request<void>(`/buildings/${id}`, { method: 'DELETE' }),

  getRooms: (params?: Record<string, string | number>) => {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''
    return request<Room[]>(`/rooms${qs}`)
  },
  getRoomStats: () => request<any[]>('/rooms/stats'),
  getRoom: (id: string) => request<Room>(`/rooms/${id}`),
  createRoom: (data: Partial<Room>) =>
    request<Room>('/rooms', { method: 'POST', body: JSON.stringify(data) }),
  updateRoom: (id: string, data: Partial<Room>) =>
    request<Room>(`/rooms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRoom: (id: string) =>
    request<void>(`/rooms/${id}`, { method: 'DELETE' }),

  getBeds: (params?: Record<string, string | number>) => {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''
    return request<any[]>(`/beds${qs}`)
  },
  getBed: (id: string) => request<Bed>(`/beds/${id}`),
  createBed: (data: Partial<Bed>) =>
    request<Bed>('/beds', { method: 'POST', body: JSON.stringify(data) }),
  updateBed: (id: string, data: Partial<Bed>) =>
    request<Bed>(`/beds/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBed: (id: string) =>
    request<void>(`/beds/${id}`, { method: 'DELETE' }),

  getWorkers: (params?: Record<string, string | number>) => {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''
    return request<any[]>('/workers' + qs)
  },
  getWorker: (id: string) => request<Worker>(`/workers/${id}`),
  createWorker: (data: Partial<Worker>) =>
    request<Worker>('/workers', { method: 'POST', body: JSON.stringify(data) }),
  updateWorker: (id: string, data: Partial<Worker>) =>
    request<Worker>(`/workers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteWorker: (id: string) =>
    request<void>(`/workers/${id}`, { method: 'DELETE' }),

  checkIn: (data: { workerId: string; bedId: string; operator?: string; reason?: string }) =>
    request<{ message: string }>('/dormitory/checkin', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  checkOut: (data: { workerId: string; operator?: string; reason?: string }) =>
    request<{ message: string }>('/dormitory/checkout', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  transfer: (data: { workerId: string; toBedId: string; operator?: string; reason?: string }) =>
    request<{ message: string }>('/dormitory/transfer', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getRecords: (params?: Record<string, string | number>) => {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''
    return request<DormitoryRecord[]>('/dormitory/records' + qs)
  },
  getOverview: () => request<any>('/dormitory/stats/overview'),
}
