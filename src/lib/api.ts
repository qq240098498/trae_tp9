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
  UtilityArrear,
  CollectionRecord,
  Deposit,
  DepositAccount,
  FeeSupplement,
  Receipt,
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

  getArrears: (params?: Record<string, string | number>) => {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''
    return request<UtilityArrear[]>(`/arrears${qs}`)
  },
  getArrear: (id: string) => request<UtilityArrear>(`/arrears/${id}`),
  getArrearCollections: (id: string) => request<CollectionRecord[]>(`/arrears/${id}/collections`),
  createArrear: (data: { billId: string; operator?: string }) =>
    request<UtilityArrear>('/arrears', { method: 'POST', body: JSON.stringify(data) }),
  collectArrear: (id: string, data: { collectionType: string; content: string; operator: string; workerId?: string; response?: string; effect?: string; remark?: string }) =>
    request<CollectionRecord>(`/arrears/${id}/collect`, { method: 'POST', body: JSON.stringify(data) }),
  payArrear: (id: string, data: { paidAmount: number; operator?: string }) =>
    request<UtilityArrear>(`/arrears/${id}/pay`, { method: 'PUT', body: JSON.stringify(data) }),
  writeOffArrear: (id: string) =>
    request<UtilityArrear>(`/arrears/${id}/write-off`, { method: 'PUT' }),
  deleteArrear: (id: string) =>
    request<void>(`/arrears/${id}`, { method: 'DELETE' }),

  getDepositAccounts: (params?: Record<string, string | number>) => {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''
    return request<DepositAccount[]>(`/deposits/accounts${qs}`)
  },
  getDepositAccount: (workerId: string) => request<DepositAccount>(`/deposits/accounts/${workerId}`),
  initializeDepositAccount: (data: { workerId: string; remark?: string }) =>
    request<DepositAccount>('/deposits/accounts/initialize', { method: 'POST', body: JSON.stringify(data) }),
  updateDepositAccount: (workerId: string, data: Partial<DepositAccount>) =>
    request<DepositAccount>(`/deposits/accounts/${workerId}`, { method: 'PUT', body: JSON.stringify(data) }),
  getDepositTransactions: (params?: Record<string, string | number>) => {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''
    return request<Deposit[]>(`/deposits/transactions${qs}`)
  },
  getDepositTransaction: (id: string) => request<Deposit>(`/deposits/transactions/${id}`),
  createDepositTransaction: (data: Partial<Deposit>) =>
    request<Deposit>('/deposits/transactions', { method: 'POST', body: JSON.stringify(data) }),
  updateDepositTransaction: (id: string, data: Partial<Deposit>) =>
    request<Deposit>(`/deposits/transactions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDepositTransaction: (id: string) =>
    request<void>(`/deposits/transactions/${id}`, { method: 'DELETE' }),
  getDepositStats: () => request<any>('/deposits/stats/summary'),

  getFeeSupplements: (params?: Record<string, string | number>) => {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''
    return request<FeeSupplement[]>(`/fee-supplements/supplements${qs}`)
  },
  getFeeSupplement: (id: string) => request<FeeSupplement>(`/fee-supplements/supplements/${id}`),
  createFeeSupplement: (data: Partial<FeeSupplement>) =>
    request<FeeSupplement>('/fee-supplements/supplements', { method: 'POST', body: JSON.stringify(data) }),
  updateFeeSupplement: (id: string, data: Partial<FeeSupplement>) =>
    request<FeeSupplement>(`/fee-supplements/supplements/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  confirmFeeSupplement: (id: string) =>
    request<FeeSupplement>(`/fee-supplements/supplements/${id}/confirm`, { method: 'PUT' }),
  payFeeSupplement: (id: string, data: { payMethod: string; transactionNo?: string; operator?: string }) =>
    request<FeeSupplement>(`/fee-supplements/supplements/${id}/pay`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteFeeSupplement: (id: string) =>
    request<void>(`/fee-supplements/supplements/${id}`, { method: 'DELETE' }),
  getFeeSupplementStats: (params?: Record<string, string | number>) => {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''
    return request<any>(`/fee-supplements/supplements/stats/summary${qs}`)
  },

  getReceipts: (params?: Record<string, string | number>) => {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''
    return request<Receipt[]>(`/fee-supplements/receipts${qs}`)
  },
  getReceipt: (id: string) => request<Receipt>(`/fee-supplements/receipts/${id}`),
  createReceipt: (data: Partial<Receipt>) =>
    request<Receipt>('/fee-supplements/receipts', { method: 'POST', body: JSON.stringify(data) }),
  updateReceipt: (id: string, data: Partial<Receipt>) =>
    request<Receipt>(`/fee-supplements/receipts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  printReceipt: (id: string) =>
    request<Receipt>(`/fee-supplements/receipts/${id}/print`, { method: 'PUT' }),
  deleteReceipt: (id: string) =>
    request<void>(`/fee-supplements/receipts/${id}`, { method: 'DELETE' }),
  getReceiptStats: (params?: Record<string, string | number>) => {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''
    return request<any>(`/fee-supplements/receipts/stats/summary${qs}`)
  },
}
