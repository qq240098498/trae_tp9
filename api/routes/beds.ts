import { Router, type Request, type Response } from 'express'
import { readDB, writeDB, generateId } from '../lib/db.js'
import type { Bed } from '../../src/types/index.ts'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const { roomId, status } = req.query
  let beds = db.beds
  if (roomId) {
    beds = beds.filter((b) => b.roomId === roomId)
  }
  if (status) {
    beds = beds.filter((b) => b.status === status)
  }
  const result = beds.map((bed) => {
    const room = db.rooms.find((r) => r.id === bed.roomId)
    const worker = bed.workerId ? db.workers.find((w) => w.id === bed.workerId) : null
    return {
      ...bed,
      roomNumber: room?.roomNumber,
      workerName: worker?.name,
    }
  })
  res.json({ success: true, data: result })
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const bed = db.beds.find((b) => b.id === req.params.id)
  if (!bed) {
    res.status(404).json({ success: false, error: '床位不存在' })
    return
  }
  res.json({ success: true, data: bed })
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const newBed: Bed = {
    id: generateId('bed'),
    bedNumber: req.body.bedNumber,
    roomId: req.body.roomId,
    status: req.body.status || 'available',
    remark: req.body.remark,
  }
  db.beds.push(newBed)
  writeDB(db)
  res.json({ success: true, data: newBed })
})

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const idx = db.beds.findIndex((b) => b.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: '床位不存在' })
    return
  }
  db.beds[idx] = {
    ...db.beds[idx],
    ...req.body,
  }
  writeDB(db)
  res.json({ success: true, data: db.beds[idx] })
})

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const idx = db.beds.findIndex((b) => b.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: '床位不存在' })
    return
  }
  if (db.beds[idx].status === 'occupied') {
    res.status(400).json({ success: false, error: '该床位有人入住，无法删除' })
    return
  }
  db.beds.splice(idx, 1)
  writeDB(db)
  res.json({ success: true })
})

export default router
