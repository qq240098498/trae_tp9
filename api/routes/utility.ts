import { Router, type Request, type Response } from 'express'
import { readDB, writeDB, generateId } from '../lib/db.js'
import type { UtilityReading, UtilityPrice } from '../../src/types/index.ts'

const router = Router()

router.get('/readings', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const { roomId, buildingId, startDate, endDate } = req.query
  let readings = [...db.utilityReadings].sort(
    (a, b) => new Date(b.readingDate).getTime() - new Date(a.readingDate).getTime(),
  )
  if (roomId) {
    readings = readings.filter((r) => r.roomId === roomId)
  }
  if (buildingId) {
    readings = readings.filter((r) => r.buildingId === buildingId)
  }
  if (startDate) {
    readings = readings.filter((r) => new Date(r.readingDate) >= new Date(String(startDate)))
  }
  if (endDate) {
    const end = new Date(String(endDate))
    end.setDate(end.getDate() + 1)
    readings = readings.filter((r) => new Date(r.readingDate) < end)
  }
  res.json({ success: true, data: readings })
})

router.get('/readings/:id', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const reading = db.utilityReadings.find((r) => r.id === req.params.id)
  if (!reading) {
    res.status(404).json({ success: false, error: '抄表记录不存在' })
    return
  }
  res.json({ success: true, data: reading })
})

router.get('/readings/last/:roomId', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const readings = db.utilityReadings
    .filter((r) => r.roomId === req.params.roomId)
    .sort((a, b) => new Date(b.readingDate).getTime() - new Date(a.readingDate).getTime())
  const lastReading = readings[0] || null
  res.json({ success: true, data: lastReading })
})

router.post('/readings', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const { roomId, readingDate, electricityReading, waterReading, operator, remark } = req.body

  if (!roomId || !readingDate || electricityReading === undefined || waterReading === undefined) {
    res.status(400).json({ success: false, error: '请填写完整信息' })
    return
  }

  const room = db.rooms.find((r) => r.id === roomId)
  if (!room) {
    res.status(404).json({ success: false, error: '房间不存在' })
    return
  }

  const building = db.buildings.find((b) => b.id === room.buildingId)

  const lastReadings = db.utilityReadings
    .filter((r) => r.roomId === roomId)
    .sort((a, b) => new Date(b.readingDate).getTime() - new Date(a.readingDate).getTime())

  const lastReading = lastReadings[0]
  const lastElectricityReading = lastReading?.electricityReading || 0
  const lastWaterReading = lastReading?.waterReading || 0

  const electricityUsage = Math.max(0, electricityReading - lastElectricityReading)
  const waterUsage = Math.max(0, waterReading - lastWaterReading)

  const now = new Date().toISOString()
  const newReading: UtilityReading = {
    id: generateId('util_rd'),
    roomId,
    roomNumber: room.roomNumber,
    buildingId: room.buildingId,
    buildingName: building?.name || '',
    readingDate,
    electricityReading,
    waterReading,
    lastElectricityReading,
    lastWaterReading,
    electricityUsage,
    waterUsage,
    operator: operator || '管理员',
    remark,
    createdAt: now,
    updatedAt: now,
  }

  db.utilityReadings.push(newReading)
  writeDB(db)
  res.json({ success: true, data: newReading })
})

router.put('/readings/:id', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const idx = db.utilityReadings.findIndex((r) => r.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: '抄表记录不存在' })
    return
  }

  const { electricityReading, waterReading } = req.body
  const reading = db.utilityReadings[idx]

  const electricityUsage = Math.max(0, (electricityReading ?? reading.electricityReading) - reading.lastElectricityReading)
  const waterUsage = Math.max(0, (waterReading ?? reading.waterReading) - reading.lastWaterReading)

  db.utilityReadings[idx] = {
    ...reading,
    ...req.body,
    electricityUsage,
    waterUsage,
    updatedAt: new Date().toISOString(),
  }
  writeDB(db)
  res.json({ success: true, data: db.utilityReadings[idx] })
})

router.delete('/readings/:id', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const idx = db.utilityReadings.findIndex((r) => r.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: '抄表记录不存在' })
    return
  }
  db.utilityReadings.splice(idx, 1)
  writeDB(db)
  res.json({ success: true })
})

router.get('/price', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  res.json({ success: true, data: db.utilityPrice })
})

router.put('/price', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const { electricityPrice, waterPrice } = req.body
  if (electricityPrice === undefined || waterPrice === undefined) {
    res.status(400).json({ success: false, error: '请填写完整价格信息' })
    return
  }
  const newPrice: UtilityPrice = {
    electricityPrice,
    waterPrice,
    updatedAt: new Date().toISOString(),
  }
  db.utilityPrice = newPrice
  writeDB(db)
  res.json({ success: true, data: newPrice })
})

export default router
