import { Router, type Request, type Response } from 'express'
import { readDB, writeDB, generateId } from '../lib/db.js'
import type { Worker } from '../../src/types/index.ts'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const { status, team, keyword } = req.query
  let workers = db.workers
  if (status) {
    workers = workers.filter((w) => w.status === status)
  }
  if (team) {
    workers = workers.filter((w) => w.team === team)
  }
  if (keyword) {
    const kw = String(keyword).toLowerCase()
    workers = workers.filter(
      (w) =>
        w.name.toLowerCase().includes(kw) ||
        w.workerNumber.toLowerCase().includes(kw) ||
        w.phone.includes(kw) ||
        w.idCard.includes(kw),
    )
  }
  const result = workers.map((w) => {
    const bed = w.bedId ? db.beds.find((b) => b.id === w.bedId) : null
    const room = w.roomId ? db.rooms.find((r) => r.id === w.roomId) : null
    const building = room ? db.buildings.find((b) => b.id === room.buildingId) : null
    return {
      ...w,
      bedNumber: bed?.bedNumber,
      roomNumber: room?.roomNumber,
      buildingName: building?.name,
    }
  })
  res.json({ success: true, data: result })
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const worker = db.workers.find((w) => w.id === req.params.id)
  if (!worker) {
    res.status(404).json({ success: false, error: '工人不存在' })
    return
  }
  res.json({ success: true, data: worker })
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const now = new Date().toISOString()
  const newWorker: Worker = {
    id: generateId('wk'),
    name: req.body.name,
    gender: req.body.gender,
    idCard: req.body.idCard,
    workerNumber: req.body.workerNumber,
    phone: req.body.phone,
    team: req.body.team,
    hometown: req.body.hometown,
    emergencyContact: req.body.emergencyContact,
    emergencyPhone: req.body.emergencyPhone,
    status: req.body.status || 'active',
    createdAt: now,
    updatedAt: now,
  }
  db.workers.push(newWorker)
  writeDB(db)
  res.json({ success: true, data: newWorker })
})

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const idx = db.workers.findIndex((w) => w.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: '工人不存在' })
    return
  }
  db.workers[idx] = {
    ...db.workers[idx],
    ...req.body,
    updatedAt: new Date().toISOString(),
  }
  writeDB(db)
  res.json({ success: true, data: db.workers[idx] })
})

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const idx = db.workers.findIndex((w) => w.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: '工人不存在' })
    return
  }
  if (db.workers[idx].bedId) {
    res.status(400).json({ success: false, error: '该工人已入住，请先办理退宿' })
    return
  }
  db.workers.splice(idx, 1)
  writeDB(db)
  res.json({ success: true })
})

export default router
