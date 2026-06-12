import { create } from 'zustand'
import { api } from '../lib/api'
import type {
  Building,
  Room,
  Worker,
  DormitoryRecord,
  UtilityReading,
  UtilityBill,
  ExpenseLedger,
  StayReminder,
  UtilityPrice,
  UtilityArrear,
  CollectionRecord,
  Deposit,
  DepositAccount,
  FeeSupplement,
  Receipt,
} from '../types'

interface DormitoryState {
  buildings: Building[]
  rooms: Room[]
  roomStats: any[]
  beds: any[]
  workers: any[]
  records: DormitoryRecord[]
  overview: any
  utilityReadings: UtilityReading[]
  utilityBills: UtilityBill[]
  expenseLedgers: ExpenseLedger[]
  stayReminders: StayReminder[]
  utilityPrice: UtilityPrice | null
  utilityReadingStats: any
  billsStats: any
  expenseStats: any
  reminderStats: any
  loading: boolean
  error: string | null

  utilityArrears: UtilityArrear[]
  arrearStats: any
  depositAccounts: DepositAccount[]
  depositTransactions: Deposit[]
  depositStats: any
  feeSupplements: FeeSupplement[]
  feeSupplementStats: any
  receipts: Receipt[]
  receiptStats: any

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

  checkIn: (data: { workerId: string; bedId: string; operator?: string; reason?: string; expectedCheckOutDate?: string }) => Promise<void>
  checkOut: (data: { workerId: string; operator?: string; reason?: string }) => Promise<void>
  transfer: (data: { workerId: string; toBedId: string; operator?: string; reason?: string }) => Promise<void>

  fetchUtilityReadings: (params?: Record<string, string | number>) => Promise<void>
  fetchUtilityReading: (id: string) => Promise<UtilityReading | undefined>
  fetchLastUtilityReading: (roomId: string) => Promise<UtilityReading | null>
  addUtilityReading: (data: Partial<UtilityReading>) => Promise<void>
  updateUtilityReading: (id: string, data: Partial<UtilityReading>) => Promise<void>
  removeUtilityReading: (id: string) => Promise<void>
  fetchUtilityPrice: () => Promise<void>
  updateUtilityPrice: (data: Partial<UtilityPrice>) => Promise<void>

  fetchBills: (params?: Record<string, string | number>) => Promise<void>
  fetchBill: (id: string) => Promise<UtilityBill | undefined>
  generateBill: (data: { readingId: string; operator?: string }) => Promise<void>
  batchGenerateBills: (data: { readingIds: string[]; operator?: string }) => Promise<void>
  confirmBill: (id: string) => Promise<void>
  payBill: (id: string) => Promise<void>
  updateBill: (id: string, data: Partial<UtilityBill>) => Promise<void>
  removeBill: (id: string) => Promise<void>
  fetchBillsStats: (params?: Record<string, string | number>) => Promise<void>

  fetchExpenseLedgers: (params?: Record<string, string | number>) => Promise<void>
  fetchExpenseLedger: (id: string) => Promise<ExpenseLedger | undefined>
  addExpenseLedger: (data: Partial<ExpenseLedger>) => Promise<void>
  updateExpenseLedger: (id: string, data: Partial<ExpenseLedger>) => Promise<void>
  removeExpenseLedger: (id: string) => Promise<void>
  fetchExpenseStats: (params?: Record<string, string | number>) => Promise<void>

  fetchReminders: (params?: Record<string, string | number>) => Promise<void>
  fetchReminder: (id: string) => Promise<StayReminder | undefined>
  generateReminders: () => Promise<void>
  notifyReminder: (id: string) => Promise<void>
  resolveReminder: (id: string, data?: { remark?: string }) => Promise<void>
  updateReminder: (id: string, data: Partial<StayReminder>) => Promise<void>
  removeReminder: (id: string) => Promise<void>
  fetchReminderStats: () => Promise<void>

  fetchArrears: (params?: Record<string, string | number>) => Promise<void>
  createArrear: (data: { billId: string; operator?: string }) => Promise<void>
  collectArrear: (id: string, data: { collectionType: string; content: string; operator: string; workerId?: string; response?: string; effect?: string; remark?: string }) => Promise<void>
  payArrear: (id: string, data: { paidAmount: number; operator?: string }) => Promise<void>
  writeOffArrear: (id: string) => Promise<void>
  removeArrear: (id: string) => Promise<void>

  fetchDepositAccounts: (params?: Record<string, string | number>) => Promise<void>
  initializeDepositAccount: (data: { workerId: string; remark?: string }) => Promise<void>
  updateDepositAccount: (workerId: string, data: Partial<DepositAccount>) => Promise<void>
  fetchDepositTransactions: (params?: Record<string, string | number>) => Promise<void>
  createDepositTransaction: (data: Partial<Deposit>) => Promise<void>
  updateDepositTransaction: (id: string, data: Partial<Deposit>) => Promise<void>
  removeDepositTransaction: (id: string) => Promise<void>
  fetchDepositStats: () => Promise<void>

  fetchFeeSupplements: (params?: Record<string, string | number>) => Promise<void>
  createFeeSupplement: (data: Partial<FeeSupplement>) => Promise<void>
  updateFeeSupplement: (id: string, data: Partial<FeeSupplement>) => Promise<void>
  confirmFeeSupplement: (id: string) => Promise<void>
  payFeeSupplement: (id: string, data: { payMethod: string; transactionNo?: string; operator?: string }) => Promise<void>
  removeFeeSupplement: (id: string) => Promise<void>
  fetchFeeSupplementStats: (params?: Record<string, string | number>) => Promise<void>

  fetchReceipts: (params?: Record<string, string | number>) => Promise<void>
  createReceipt: (data: Partial<Receipt>) => Promise<void>
  updateReceipt: (id: string, data: Partial<Receipt>) => Promise<void>
  printReceipt: (id: string) => Promise<void>
  removeReceipt: (id: string) => Promise<void>
  fetchReceiptStats: (params?: Record<string, string | number>) => Promise<void>
}

export const useDormitoryStore = create<DormitoryState>((set, get) => ({
  buildings: [],
  rooms: [],
  roomStats: [],
  beds: [],
  workers: [],
  records: [],
  overview: null,
  utilityReadings: [],
  utilityBills: [],
  expenseLedgers: [],
  stayReminders: [],
  utilityPrice: null,
  utilityReadingStats: null,
  billsStats: null,
  expenseStats: null,
  reminderStats: null,
  loading: false,
  error: null,

  utilityArrears: [],
  arrearStats: null,
  depositAccounts: [],
  depositTransactions: [],
  depositStats: null,
  feeSupplements: [],
  feeSupplementStats: null,
  receipts: [],
  receiptStats: null,

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

  fetchUtilityReadings: async (params) => {
    set({ loading: true, error: null })
    try {
      const data = await api.getUtilityReadings(params)
      set({ utilityReadings: data })
    } catch (e: any) {
      set({ error: e.message })
    } finally {
      set({ loading: false })
    }
  },

  fetchUtilityReading: async (id) => {
    try {
      const data = await api.getUtilityReading(id)
      return data
    } catch (e: any) {
      set({ error: e.message })
    }
  },

  fetchLastUtilityReading: async (roomId) => {
    try {
      const data = await api.getLastUtilityReading(roomId)
      return data
    } catch (e: any) {
      set({ error: e.message })
      return null
    }
  },

  addUtilityReading: async (data) => {
    await api.createUtilityReading(data)
    await get().fetchUtilityReadings()
  },

  updateUtilityReading: async (id, data) => {
    await api.updateUtilityReading(id, data)
    await get().fetchUtilityReadings()
  },

  removeUtilityReading: async (id) => {
    await api.deleteUtilityReading(id)
    await get().fetchUtilityReadings()
  },

  fetchUtilityPrice: async () => {
    set({ loading: true, error: null })
    try {
      const data = await api.getUtilityPrice()
      set({ utilityPrice: data })
    } catch (e: any) {
      set({ error: e.message })
    } finally {
      set({ loading: false })
    }
  },

  updateUtilityPrice: async (data) => {
    await api.updateUtilityPrice(data)
    await get().fetchUtilityPrice()
  },

  fetchBills: async (params) => {
    set({ loading: true, error: null })
    try {
      const data = await api.getBills(params)
      set({ utilityBills: data })
    } catch (e: any) {
      set({ error: e.message })
    } finally {
      set({ loading: false })
    }
  },

  fetchBill: async (id) => {
    try {
      const data = await api.getBill(id)
      return data
    } catch (e: any) {
      set({ error: e.message })
    }
  },

  generateBill: async (data) => {
    await api.generateBill(data)
    await get().fetchBills()
    await get().fetchExpenseLedgers()
  },

  batchGenerateBills: async (data) => {
    await api.batchGenerateBills(data)
    await get().fetchBills()
    await get().fetchExpenseLedgers()
  },

  confirmBill: async (id) => {
    await api.confirmBill(id)
    await get().fetchBills()
    await get().fetchExpenseLedgers()
    await get().fetchBillsStats()
    await get().fetchExpenseStats()
  },

  payBill: async (id) => {
    await api.payBill(id)
    await get().fetchBills()
    await get().fetchExpenseLedgers()
    await get().fetchBillsStats()
    await get().fetchExpenseStats()
  },

  updateBill: async (id, data) => {
    await api.updateBill(id, data)
    await get().fetchBills()
  },

  removeBill: async (id) => {
    await api.deleteBill(id)
    await get().fetchBills()
    await get().fetchExpenseLedgers()
  },

  fetchBillsStats: async (params) => {
    try {
      const data = await api.getBillsStats(params)
      set({ billsStats: data })
    } catch (e: any) {
      set({ error: e.message })
    }
  },

  fetchExpenseLedgers: async (params) => {
    set({ loading: true, error: null })
    try {
      const data = await api.getExpenseLedgers(params)
      set({ expenseLedgers: data })
    } catch (e: any) {
      set({ error: e.message })
    } finally {
      set({ loading: false })
    }
  },

  fetchExpenseLedger: async (id) => {
    try {
      const data = await api.getExpenseLedger(id)
      return data
    } catch (e: any) {
      set({ error: e.message })
    }
  },

  addExpenseLedger: async (data) => {
    await api.createExpenseLedger(data)
    await get().fetchExpenseLedgers()
    await get().fetchExpenseStats()
  },

  updateExpenseLedger: async (id, data) => {
    await api.updateExpenseLedger(id, data)
    await get().fetchExpenseLedgers()
    await get().fetchExpenseStats()
  },

  removeExpenseLedger: async (id) => {
    await api.deleteExpenseLedger(id)
    await get().fetchExpenseLedgers()
    await get().fetchExpenseStats()
  },

  fetchExpenseStats: async (params) => {
    try {
      const data = await api.getExpenseStats(params)
      set({ expenseStats: data })
    } catch (e: any) {
      set({ error: e.message })
    }
  },

  fetchReminders: async (params) => {
    set({ loading: true, error: null })
    try {
      const data = await api.getReminders(params)
      set({ stayReminders: data })
    } catch (e: any) {
      set({ error: e.message })
    } finally {
      set({ loading: false })
    }
  },

  fetchReminder: async (id) => {
    try {
      const data = await api.getReminder(id)
      return data
    } catch (e: any) {
      set({ error: e.message })
    }
  },

  generateReminders: async () => {
    await api.generateReminders()
    await get().fetchReminders()
    await get().fetchReminderStats()
  },

  notifyReminder: async (id) => {
    await api.notifyReminder(id)
    await get().fetchReminders()
    await get().fetchReminderStats()
  },

  resolveReminder: async (id, data) => {
    await api.resolveReminder(id, data)
    await get().fetchReminders()
    await get().fetchReminderStats()
  },

  updateReminder: async (id, data) => {
    await api.updateReminder(id, data)
    await get().fetchReminders()
  },

  removeReminder: async (id) => {
    await api.deleteReminder(id)
    await get().fetchReminders()
    await get().fetchReminderStats()
  },

  fetchReminderStats: async () => {
    try {
      const data = await api.getReminderStats()
      set({ reminderStats: data })
    } catch (e: any) {
      set({ error: e.message })
    }
  },

  fetchArrears: async (params) => {
    set({ loading: true, error: null })
    try {
      const data = await api.getArrears(params)
      set({ utilityArrears: data })
    } catch (e: any) {
      set({ error: e.message })
    } finally {
      set({ loading: false })
    }
  },

  createArrear: async (data) => {
    await api.createArrear(data)
    await get().fetchArrears()
  },

  collectArrear: async (id, data) => {
    await api.collectArrear(id, data)
    await get().fetchArrears()
  },

  payArrear: async (id, data) => {
    await api.payArrear(id, data)
    await get().fetchArrears()
  },

  writeOffArrear: async (id) => {
    await api.writeOffArrear(id)
    await get().fetchArrears()
  },

  removeArrear: async (id) => {
    await api.deleteArrear(id)
    await get().fetchArrears()
  },

  fetchDepositAccounts: async (params) => {
    set({ loading: true, error: null })
    try {
      const data = await api.getDepositAccounts(params)
      set({ depositAccounts: data })
    } catch (e: any) {
      set({ error: e.message })
    } finally {
      set({ loading: false })
    }
  },

  initializeDepositAccount: async (data) => {
    await api.initializeDepositAccount(data)
    await get().fetchDepositAccounts()
    await get().fetchDepositStats()
  },

  updateDepositAccount: async (workerId, data) => {
    await api.updateDepositAccount(workerId, data)
    await get().fetchDepositAccounts()
  },

  fetchDepositTransactions: async (params) => {
    set({ loading: true, error: null })
    try {
      const data = await api.getDepositTransactions(params)
      set({ depositTransactions: data })
    } catch (e: any) {
      set({ error: e.message })
    } finally {
      set({ loading: false })
    }
  },

  createDepositTransaction: async (data) => {
    await api.createDepositTransaction(data)
    await get().fetchDepositTransactions()
    await get().fetchDepositAccounts()
    await get().fetchDepositStats()
  },

  updateDepositTransaction: async (id, data) => {
    await api.updateDepositTransaction(id, data)
    await get().fetchDepositTransactions()
    await get().fetchDepositAccounts()
  },

  removeDepositTransaction: async (id) => {
    await api.deleteDepositTransaction(id)
    await get().fetchDepositTransactions()
    await get().fetchDepositAccounts()
    await get().fetchDepositStats()
  },

  fetchDepositStats: async () => {
    try {
      const data = await api.getDepositStats()
      set({ depositStats: data })
    } catch (e: any) {
      set({ error: e.message })
    }
  },

  fetchFeeSupplements: async (params) => {
    set({ loading: true, error: null })
    try {
      const data = await api.getFeeSupplements(params)
      set({ feeSupplements: data })
    } catch (e: any) {
      set({ error: e.message })
    } finally {
      set({ loading: false })
    }
  },

  createFeeSupplement: async (data) => {
    await api.createFeeSupplement(data)
    await get().fetchFeeSupplements()
    await get().fetchFeeSupplementStats()
  },

  updateFeeSupplement: async (id, data) => {
    await api.updateFeeSupplement(id, data)
    await get().fetchFeeSupplements()
  },

  confirmFeeSupplement: async (id) => {
    await api.confirmFeeSupplement(id)
    await get().fetchFeeSupplements()
    await get().fetchFeeSupplementStats()
  },

  payFeeSupplement: async (id, data) => {
    await api.payFeeSupplement(id, data)
    await get().fetchFeeSupplements()
    await get().fetchFeeSupplementStats()
    await get().fetchReceipts()
  },

  removeFeeSupplement: async (id) => {
    await api.deleteFeeSupplement(id)
    await get().fetchFeeSupplements()
    await get().fetchFeeSupplementStats()
  },

  fetchFeeSupplementStats: async (params) => {
    try {
      const data = await api.getFeeSupplementStats(params)
      set({ feeSupplementStats: data })
    } catch (e: any) {
      set({ error: e.message })
    }
  },

  fetchReceipts: async (params) => {
    set({ loading: true, error: null })
    try {
      const data = await api.getReceipts(params)
      set({ receipts: data })
    } catch (e: any) {
      set({ error: e.message })
    } finally {
      set({ loading: false })
    }
  },

  createReceipt: async (data) => {
    await api.createReceipt(data)
    await get().fetchReceipts()
    await get().fetchReceiptStats()
  },

  updateReceipt: async (id, data) => {
    await api.updateReceipt(id, data)
    await get().fetchReceipts()
  },

  printReceipt: async (id) => {
    await api.printReceipt(id)
    await get().fetchReceipts()
  },

  removeReceipt: async (id) => {
    await api.deleteReceipt(id)
    await get().fetchReceipts()
    await get().fetchReceiptStats()
  },

  fetchReceiptStats: async (params) => {
    try {
      const data = await api.getReceiptStats(params)
      set({ receiptStats: data })
    } catch (e: any) {
      set({ error: e.message })
    }
  },
}))
