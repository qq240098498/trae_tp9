export interface Building {
  id: string
  name: string
  code: string
  floorCount: number
  remark?: string
  createdAt: string
  updatedAt: string
}

export interface Room {
  id: string
  roomNumber: string
  buildingId: string
  floor: number
  gender: 'male' | 'female'
  roomType: 'standard' | 'deluxe' | 'manager'
  bedCount: number
  maxOccupancy: number
  status: 'normal' | 'maintenance' | 'cleaning'
  remark?: string
  createdAt: string
  updatedAt: string
}

export interface Bed {
  id: string
  bedNumber: string
  roomId: string
  status: 'available' | 'occupied' | 'maintenance'
  workerId?: string
  remark?: string
}

export interface Worker {
  id: string
  name: string
  gender: 'male' | 'female'
  idCard: string
  workerNumber: string
  phone: string
  team: string
  hometown: string
  emergencyContact: string
  emergencyPhone: string
  status: 'active' | 'inactive' | 'left'
  bedId?: string
  roomId?: string
  checkInDate?: string
  checkOutDate?: string
  expectedCheckOutDate?: string
  createdAt: string
  updatedAt: string
}

export interface DormitoryRecord {
  id: string
  type: 'checkin' | 'checkout' | 'transfer'
  workerId: string
  workerName: string
  bedId?: string
  roomNumber?: string
  fromBedId?: string
  fromRoomNumber?: string
  toBedId?: string
  toRoomNumber?: string
  reason?: string
  operator: string
  operatedAt: string
}

export type DeviceCategory = 'air_conditioner' | 'water_heater' | 'lamp' | 'bed' | 'lock' | 'desk' | 'wardrobe' | 'other'

export type DeviceStatus = 'normal' | 'maintenance' | 'broken' | 'scrapped'

export interface Device {
  id: string
  name: string
  code: string
  category: DeviceCategory
  brand?: string
  model?: string
  roomId?: string
  roomNumber?: string
  buildingId?: string
  buildingName?: string
  status: DeviceStatus
  installDate?: string
  lastMaintenanceDate?: string
  remark?: string
  createdAt: string
  updatedAt: string
}

export type MaintenanceStatus = 'pending' | 'processing' | 'completed' | 'cancelled'
export type MaintenancePriority = 'low' | 'medium' | 'high' | 'urgent'

export interface MaintenanceRecord {
  id: string
  deviceId: string
  deviceName: string
  deviceCode: string
  roomId?: string
  roomNumber?: string
  buildingName?: string
  title: string
  description: string
  reporter: string
  reporterPhone?: string
  status: MaintenanceStatus
  priority: MaintenancePriority
  assignee?: string
  faultType?: string
  reportedAt: string
  startedAt?: string
  completedAt?: string
  solution?: string
  cost?: number
  remark?: string
}

export interface UtilityReading {
  id: string
  roomId: string
  roomNumber: string
  buildingId: string
  buildingName: string
  readingDate: string
  electricityReading: number
  waterReading: number
  lastElectricityReading: number
  lastWaterReading: number
  electricityUsage: number
  waterUsage: number
  operator: string
  remark?: string
  createdAt: string
  updatedAt: string
}

export interface UtilityPrice {
  electricityPrice: number
  waterPrice: number
  updatedAt: string
}

export interface UtilityBill {
  id: string
  roomId: string
  roomNumber: string
  buildingId: string
  buildingName: string
  billingPeriod: string
  startDate: string
  endDate: string
  electricityUsage: number
  waterUsage: number
  electricityCost: number
  waterCost: number
  totalCost: number
  readingId: string
  status: 'pending' | 'confirmed' | 'paid'
  confirmedAt?: string
  paidAt?: string
  operator?: string
  remark?: string
  createdAt: string
  updatedAt: string
}

export interface ExpenseLedger {
  id: string
  type: 'electricity' | 'water' | 'room' | 'other'
  roomId?: string
  roomNumber?: string
  buildingId?: string
  buildingName?: string
  workerId?: string
  workerName?: string
  amount: number
  description: string
  billingPeriod?: string
  recordDate: string
  operator: string
  status: 'pending' | 'confirmed' | 'paid'
  relatedBillId?: string
  remark?: string
  createdAt: string
  updatedAt: string
}

export interface StayReminder {
  id: string
  workerId: string
  workerName: string
  workerPhone: string
  roomId?: string
  roomNumber?: string
  checkInDate: string
  expectedCheckOutDate: string
  daysRemaining: number
  reminderType: 'week' | 'three_days' | 'one_day' | 'overdue'
  status: 'pending' | 'notified' | 'resolved'
  notifiedAt?: string
  resolvedAt?: string
  remark?: string
  createdAt: string
  updatedAt: string
}

export interface Database {
  buildings: Building[]
  rooms: Room[]
  beds: Bed[]
  workers: Worker[]
  records: DormitoryRecord[]
  devices: Device[]
  maintenanceRecords: MaintenanceRecord[]
  utilityReadings: UtilityReading[]
  utilityBills: UtilityBill[]
  expenseLedgers: ExpenseLedger[]
  stayReminders: StayReminder[]
  utilityPrice: UtilityPrice
}

export const GenderLabel: Record<'male' | 'female', string> = {
  male: '男',
  female: '女',
}

export const RoomGenderLabel: Record<Room['gender'], string> = {
  male: '男宿舍',
  female: '女宿舍',
}

export const WorkerGenderLabel: Record<Worker['gender'], string> = {
  male: '男',
  female: '女',
}

export const RoomTypeLabel: Record<Room['roomType'], string> = {
  standard: '标准间',
  deluxe: '豪华间',
  manager: '管理间',
}

export const RoomStatusLabel: Record<Room['status'], string> = {
  normal: '正常',
  maintenance: '维修中',
  cleaning: '清扫中',
}

export const BedStatusLabel: Record<Bed['status'], string> = {
  available: '空闲',
  occupied: '已入住',
  maintenance: '维修中',
}

export const WorkerStatusLabel: Record<Worker['status'], string> = {
  active: '在职',
  inactive: '停职',
  left: '已离职',
}

export const RecordTypeLabel: Record<DormitoryRecord['type'], string> = {
  checkin: '入住',
  checkout: '退宿',
  transfer: '调房',
}

export const DeviceCategoryLabel: Record<DeviceCategory, string> = {
  air_conditioner: '空调',
  water_heater: '热水器',
  lamp: '灯具',
  bed: '床铺',
  lock: '门锁',
  desk: '书桌',
  wardrobe: '衣柜',
  other: '其他',
}

export const DeviceStatusLabel: Record<DeviceStatus, string> = {
  normal: '正常',
  maintenance: '维护中',
  broken: '故障',
  scrapped: '已报废',
}

export const MaintenanceStatusLabel: Record<MaintenanceStatus, string> = {
  pending: '待处理',
  processing: '处理中',
  completed: '已完成',
  cancelled: '已取消',
}

export const MaintenancePriorityLabel: Record<MaintenancePriority, string> = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '紧急',
}

export const UtilityBillStatusLabel: Record<UtilityBill['status'], string> = {
  pending: '待确认',
  confirmed: '已确认',
  paid: '已缴费',
}

export const ExpenseLedgerTypeLabel: Record<ExpenseLedger['type'], string> = {
  electricity: '电费',
  water: '水费',
  room: '房费',
  other: '其他',
}

export const ExpenseLedgerStatusLabel: Record<ExpenseLedger['status'], string> = {
  pending: '待确认',
  confirmed: '已确认',
  paid: '已缴费',
}

export const ReminderTypeLabel: Record<StayReminder['reminderType'], string> = {
  week: '一周内到期',
  three_days: '三天内到期',
  one_day: '一天内到期',
  overdue: '已逾期',
}

export const ReminderStatusLabel: Record<StayReminder['status'], string> = {
  pending: '待处理',
  notified: '已通知',
  resolved: '已处理',
}

export type { DormitoryRecord as Record }
