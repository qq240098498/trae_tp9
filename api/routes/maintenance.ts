import { Router, type Request, type Response } from 'express'
import { readDB, writeDB, generateId } from '../lib/db.js'
import type { MaintenanceRecord } from '../../src/types/index.ts'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const { status, priority, deviceId, roomId } = req.query
  let records = db.maintenanceRecords
  if (status) {
    records = records.filter((r) => r.status === status)
  }
  if (priority) {
    records = records.filter((r) => r.priority === priority)
  }
  if (deviceId) {
    records = records.filter((r) => r.deviceId === deviceId)
  }
  if (roomId) {
    records = records.filter((r) => r.roomId === roomId)
  }
  records.sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime())
  res.json({ success: true, data: records })
})

router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const stats = {
    total: db.maintenanceRecords.length,
    pending: db.maintenanceRecords.filter((r) => r.status === 'pending').length,
    processing: db.maintenanceRecords.filter((r) => r.status === 'processing').length,
    completed: db.maintenanceRecords.filter((r) => r.status === 'completed').length,
    cancelled: db.maintenanceRecords.filter((r) => r.status === 'cancelled').length,
  }
  res.json({ success: true, data: stats })
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const record = db.maintenanceRecords.find((r) => r.id === req.params.id)
  if (!record) {
    res.status(404).json({ success: false, error: '维修工单不存在' })
    return
  }
  res.json({ success: true, data: record })
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const now = new Date().toISOString()
  const device = db.devices.find((d) => d.id === req.body.deviceId)
  if (!device) {
    res.status(400).json({ success: false, error: '设备不存在' })
    return
  }
  const room = db.rooms.find((r) => r.id === device.roomId)
  const building = db.buildings.find((b) => b.id === device.buildingId)
  const newRecord: MaintenanceRecord = {
    id: generateId('mnt'),
    deviceId: req.body.deviceId,
    deviceName: device.name,
    deviceCode: device.code,
    roomId: device.roomId,
    roomNumber: room?.roomNumber,
    buildingName: building?.name,
    title: req.body.title,
    description: req.body.description,
    reporter: req.body.reporter,
    reporterPhone: req.body.reporterPhone,
    status: req.body.status || 'pending',
    priority: req.body.priority || 'medium',
    assignee: req.body.assignee,
    faultType: req.body.faultType,
    reportedAt: now,
    solution: req.body.solution,
    cost: req.body.cost,
    remark: req.body.remark,
  }
  db.maintenanceRecords.push(newRecord)
  if (newRecord.status !== 'completed' && newRecord.status !== 'cancelled') {
    const deviceIdx = db.devices.findIndex((d) => d.id === req.body.deviceId)
    if (deviceIdx !== -1) {
      db.devices[deviceIdx] = {
        ...db.devices[deviceIdx],
        status: 'maintenance',
        updatedAt: now,
      }
    }
  }
  writeDB(db)
  res.json({ success: true, data: newRecord })
})

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const idx = db.maintenanceRecords.findIndex((r) => r.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: '维修工单不存在' })
    return
  }
  const now = new Date().toISOString()
  const oldStatus = db.maintenanceRecords[idx].status
  const newStatus = req.body.status || oldStatus
  const updates: Partial<MaintenanceRecord> = { ...req.body }
  if (newStatus === 'processing' && !db.maintenanceRecords[idx].startedAt) {
    updates.startedAt = now
  }
  if (newStatus === 'completed' && !db.maintenanceRecords[idx].completedAt) {
    updates.completedAt = now
  }
  db.maintenanceRecords[idx] = {
    ...db.maintenanceRecords[idx],
    ...updates,
  }
  if (newStatus !== oldStatus) {
    const deviceIdx = db.devices.findIndex(
      (d) => d.id === db.maintenanceRecords[idx].deviceId,
    )
    if (deviceIdx !== -1) {
      if (newStatus === 'completed' || newStatus === 'cancelled') {
        const hasOtherActive = db.maintenanceRecords.some(
          (r) =>
            r.id !== db.maintenanceRecords[idx].id &&
            r.deviceId === db.maintenanceRecords[idx].deviceId &&
            (r.status === 'pending' || r.status === 'processing'),
        )
        if (!hasOtherActive) {
          db.devices[deviceIdx] = {
            ...db.devices[deviceIdx],
            status: 'normal',
            updatedAt: now,
          }
        }
      } else {
        db.devices[deviceIdx] = {
          ...db.devices[deviceIdx],
          status: 'maintenance',
          updatedAt: now,
        }
      }
    }
  }
  writeDB(db)
  res.json({ success: true, data: db.maintenanceRecords[idx] })
})

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const idx = db.maintenanceRecords.findIndex((r) => r.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: '维修工单不存在' })
    return
  }
  const record = db.maintenanceRecords[idx]
  db.maintenanceRecords.splice(idx, 1)
  if (record.status === 'pending' || record.status === 'processing') {
    const hasOtherActive = db.maintenanceRecords.some(
      (r) =>
        r.deviceId === record.deviceId &&
        (r.status === 'pending' || r.status === 'processing'),
    )
    if (!hasOtherActive) {
      const deviceIdx = db.devices.findIndex((d) => d.id === record.deviceId)
      if (deviceIdx !== -1) {
        db.devices[deviceIdx] = {
          ...db.devices[deviceIdx],
          status: 'normal',
          updatedAt: new Date().toISOString(),
        }
      }
    }
  }
  writeDB(db)
  res.json({ success: true })
})

export default router
