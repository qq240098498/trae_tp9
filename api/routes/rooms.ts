import { Router, type Request, type Response } from 'express'
import { readDB, writeDB, generateId } from '../lib/db.js'
import type { Room } from '../../src/types/index.ts'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const { buildingId, floor, status } = req.query
  let rooms = db.rooms
  if (buildingId) {
    rooms = rooms.filter((r) => r.buildingId === buildingId)
  }
  if (floor) {
    rooms = rooms.filter((r) => r.floor === Number(floor))
  }
  if (status) {
    rooms = rooms.filter((r) => r.status === status)
  }
  res.json({ success: true, data: rooms })
})

router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const stats = db.rooms.map((room) => {
    const beds = db.beds.filter((b) => b.roomId === room.id)
    const occupied = beds.filter((b) => b.status === 'occupied').length
    const available = beds.filter((b) => b.status === 'available').length
    const maintenance = beds.filter((b) => b.status === 'maintenance').length
    const building = db.buildings.find((b) => b.id === room.buildingId)
    return {
      ...room,
      buildingName: building?.name,
      occupiedCount: occupied,
      availableCount: available,
      maintenanceCount: maintenance,
    }
  })
  res.json({ success: true, data: stats })
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const room = db.rooms.find((r) => r.id === req.params.id)
  if (!room) {
    res.status(404).json({ success: false, error: '房间不存在' })
    return
  }
  res.json({ success: true, data: room })
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const now = new Date().toISOString()
  const newRoom: Room = {
    id: generateId('room'),
    roomNumber: req.body.roomNumber,
    buildingId: req.body.buildingId,
    floor: req.body.floor,
    gender: req.body.gender || 'male',
    roomType: req.body.roomType || 'standard',
    bedCount: req.body.bedCount,
    maxOccupancy: req.body.maxOccupancy || req.body.bedCount,
    status: req.body.status || 'normal',
    remark: req.body.remark,
    createdAt: now,
    updatedAt: now,
  }
  db.rooms.push(newRoom)
  for (let i = 1; i <= newRoom.bedCount; i++) {
    db.beds.push({
      id: generateId('bed'),
      bedNumber: `${newRoom.roomNumber}-${i}`,
      roomId: newRoom.id,
      status: newRoom.status === 'normal' ? 'available' : 'maintenance',
    })
  }
  writeDB(db)
  res.json({ success: true, data: newRoom })
})

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const idx = db.rooms.findIndex((r) => r.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: '房间不存在' })
    return
  }
  db.rooms[idx] = {
    ...db.rooms[idx],
    ...req.body,
    updatedAt: new Date().toISOString(),
  }
  writeDB(db)
  res.json({ success: true, data: db.rooms[idx] })
})

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const idx = db.rooms.findIndex((r) => r.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: '房间不存在' })
    return
  }
  const hasOccupied = db.beds.some(
    (b) => b.roomId === req.params.id && b.status === 'occupied',
  )
  if (hasOccupied) {
    res.status(400).json({ success: false, error: '该房间还有入住人员，无法删除' })
    return
  }
  db.rooms.splice(idx, 1)
  db.beds = db.beds.filter((b) => b.roomId !== req.params.id)
  writeDB(db)
  res.json({ success: true })
})

export default router
