import type {
  Building,
  Room,
  Bed,
  Worker,
  DormitoryRecord,
  Device,
  MaintenanceRecord,
  UtilityReading,
  UtilityPrice,
  UtilityBill,
  ExpenseLedger,
  StayReminder,
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

  getDevices: (params?: Record<string, string | number>) => {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''
    return request<Device[]>('/devices' + qs)
  },
  getDeviceStats: () => request<any>('/devices/stats'),
  getDevice: (id: string) => request<Device>(`/devices/${id}`),
  createDevice: (data: Partial<Device>) =>
    request<Device>('/devices', { method: 'POST', body: JSON.stringify(data) }),
  updateDevice: (id: string, data: Partial<Device>) =>
    request<Device>(`/devices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDevice: (id: string) =>
    request<void>(`/devices/${id}`, { method: 'DELETE' }),

  getMaintenanceRecords: (params?: Record<string, string | number>) => {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''
    return request<MaintenanceRecord[]>('/maintenance' + qs)
  },
  getMaintenanceStats: () => request<any>('/maintenance/stats'),
  getMaintenanceRecord: (id: string) => request<MaintenanceRecord>(`/maintenance/${id}`),
  createMaintenanceRecord: (data: Partial<MaintenanceRecord>) =>
    request<MaintenanceRecord>('/maintenance', { method: 'POST', body: JSON.stringify(data) }),
  updateMaintenanceRecord: (id: string, data: Partial<MaintenanceRecord>) =>
    request<MaintenanceRecord>(`/maintenance/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMaintenanceRecord: (id: string) =>
    request<void>(`/maintenance/${id}`, { method: 'DELETE' }),

  getUtilityReadings: (params?: Record<string, string | number>) => {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''
    return request<UtilityReading[]>('/utility/readings' + qs)
  },
  getUtilityReading: (id: string) => request<UtilityReading>(`/utility/readings/${id}`),
  getLastUtilityReading: (roomId: string) => request<UtilityReading | null>(`/utility/readings/last/${roomId}`),
  createUtilityReading: (data: Partial<UtilityReading>) =>
    request<UtilityReading>('/utility/readings', { method: 'POST', body: JSON.stringify(data) }),
  updateUtilityReading: (id: string, data: Partial<UtilityReading>) =>
    request<UtilityReading>(`/utility/readings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUtilityReading: (id: string) =>
    request<void>(`/utility/readings/${id}`, { method: 'DELETE' }),
  getUtilityPrice: () => request<UtilityPrice>('/utility/price'),
  updateUtilityPrice: (data: Partial<UtilityPrice>) =>
    request<UtilityPrice>('/utility/price', { method: 'PUT', body: JSON.stringify(data) }),

  getBills: (params?: Record<string, string | number>) => {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''
    return request<UtilityBill[]>('/bills' + qs)
  },
  getBill: (id: string) => request<UtilityBill>(`/bills/${id}`),
  generateBill: (data: { readingId: string; operator?: string }) =>
    request<UtilityBill>('/bills/generate', { method: 'POST', body: JSON.stringify(data) }),
  batchGenerateBills: (data: { readingIds: string[]; operator?: string }) =>
    request<{ generated: UtilityBill[]; errors: string[] }>('/bills/batch-generate', { method: 'POST', body: JSON.stringify(data) }),
  confirmBill: (id: string) =>
    request<UtilityBill>(`/bills/${id}/confirm`, { method: 'PUT' }),
  payBill: (id: string) =>
    request<UtilityBill>(`/bills/${id}/pay`, { method: 'PUT' }),
  updateBill: (id: string, data: Partial<UtilityBill>) =>
    request<UtilityBill>(`/bills/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBill: (id: string) =>
    request<void>(`/bills/${id}`, { method: 'DELETE' }),
  getBillsStats: (params?: Record<string, string | number>) => {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''
    return request<any>('/bills/stats/summary' + qs)
  },

  getExpenseLedgers: (params?: Record<string, string | number>) => {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''
    return request<ExpenseLedger[]>('/expense/ledgers' + qs)
  },
  getExpenseLedger: (id: string) => request<ExpenseLedger>(`/expense/ledgers/${id}`),
  createExpenseLedger: (data: Partial<ExpenseLedger>) =>
    request<ExpenseLedger>('/expense/ledgers', { method: 'POST', body: JSON.stringify(data) }),
  updateExpenseLedger: (id: string, data: Partial<ExpenseLedger>) =>
    request<ExpenseLedger>(`/expense/ledgers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteExpenseLedger: (id: string) =>
    request<void>(`/expense/ledgers/${id}`, { method: 'DELETE' }),
  exportExpenseLedgers: (params?: Record<string, string | number>) => {
    const qs = params ? '&' + new URLSearchParams(params as Record<string, string>).toString() : ''
    return `/api/expense/ledgers/export?format=csv${qs}`
  },
  getExpenseStats: (params?: Record<string, string | number>) => {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''
    return request<any>('/expense/stats/summary' + qs)
  },

  getReminders: (params?: Record<string, string | number>) => {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''
    return request<StayReminder[]>('/reminders' + qs)
  },
  getReminder: (id: string) => request<StayReminder>(`/reminders/${id}`),
  generateReminders: () =>
    request<{ newCount: number; updatedCount: number; totalActive: number; reminders: StayReminder[] }>('/reminders/generate/auto'),
  notifyReminder: (id: string) =>
    request<StayReminder>(`/reminders/${id}/notify`, { method: 'PUT' }),
  resolveReminder: (id: string, data?: { remark?: string }) =>
    request<StayReminder>(`/reminders/${id}/resolve`, { method: 'PUT', body: JSON.stringify(data || {}) }),
  updateReminder: (id: string, data: Partial<StayReminder>) =>
    request<StayReminder>(`/reminders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteReminder: (id: string) =>
    request<void>(`/reminders/${id}`, { method: 'DELETE' }),
  getReminderStats: () => request<any>('/reminders/stats/count'),
}
