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

export interface Database {
  buildings: Building[]
  rooms: Room[]
  beds: Bed[]
  workers: Worker[]
  records: DormitoryRecord[]
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

export type { DormitoryRecord as Record }
