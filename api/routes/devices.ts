import { Router, type Request, type Response } from 'express'
import { readDB, writeDB, generateId } from '../lib/db.js'
import type { Device } from '../../src/types/index.ts'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const { buildingId, roomId, category, status } = req.query
  let devices = db.devices.map((device) => {
    const room = db.rooms.find((r) => r.id === device.roomId)
    const building = db.buildings.find((b) => b.id === device.buildingId)
    return {
      ...device,
      roomNumber: room?.roomNumber,
      buildingName: building?.name,
    }
  })
  if (buildingId) {
    devices = devices.filter((d) => d.buildingId === buildingId)
  }
  if (roomId) {
    devices = devices.filter((d) => d.roomId === roomId)
  }
  if (category) {
    devices = devices.filter((d) => d.category === category)
  }
  if (status) {
    devices = devices.filter((d) => d.status === status)
  }
  devices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  res.json({ success: true, data: devices })
})

router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const stats = {
    total: db.devices.length,
    normal: db.devices.filter((d) => d.status === 'normal').length,
    maintenance: db.devices.filter((d) => d.status === 'maintenance').length,
    broken: db.devices.filter((d) => d.status === 'broken').length,
    scrapped: db.devices.filter((d) => d.status === 'scrapped').length,
  }
  res.json({ success: true, data: stats })
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const device = db.devices.find((d) => d.id === req.params.id)
  if (!device) {
    res.status(404).json({ success: false, error: '设备不存在' })
    return
  }
  const room = db.rooms.find((r) => r.id === device.roomId)
  const building = db.buildings.find((b) => b.id === device.buildingId)
  res.json({
    success: true,
    data: {
      ...device,
      roomNumber: room?.roomNumber,
      buildingName: building?.name,
    },
  })
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const now = new Date().toISOString()
  const newDevice: Device = {
    id: generateId('dev'),
    name: req.body.name,
    code: req.body.code,
    category: req.body.category,
    brand: req.body.brand,
    model: req.body.model,
    roomId: req.body.roomId,
    buildingId: req.body.buildingId,
    status: req.body.status || 'normal',
    installDate: req.body.installDate,
    lastMaintenanceDate: req.body.lastMaintenanceDate,
    remark: req.body.remark,
    createdAt: now,
    updatedAt: now,
  }
  db.devices.push(newDevice)
  writeDB(db)
  res.json({ success: true, data: newDevice })
})

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const idx = db.devices.findIndex((d) => d.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: '设备不存在' })
    return
  }
  db.devices[idx] = {
    ...db.devices[idx],
    ...req.body,
    updatedAt: new Date().toISOString(),
  }
  writeDB(db)
  res.json({ success: true, data: db.devices[idx] })
})

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const idx = db.devices.findIndex((d) => d.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: '设备不存在' })
    return
  }
  db.devices.splice(idx, 1)
  writeDB(db)
  res.json({ success: true })
})

export default router
