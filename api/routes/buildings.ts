import { Router, type Request, type Response } from 'express'
import { readDB, writeDB, generateId } from '../lib/db.js'
import type { Building } from '../../src/types/index.ts'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  res.json({ success: true, data: db.buildings })
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const building = db.buildings.find((b) => b.id === req.params.id)
  if (!building) {
    res.status(404).json({ success: false, error: '楼栋不存在' })
    return
  }
  res.json({ success: true, data: building })
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const now = new Date().toISOString()
  const newBuilding: Building = {
    id: generateId('bld'),
    name: req.body.name,
    code: req.body.code,
    floorCount: req.body.floorCount,
    remark: req.body.remark,
    createdAt: now,
    updatedAt: now,
  }
  db.buildings.push(newBuilding)
  writeDB(db)
  res.json({ success: true, data: newBuilding })
})

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const idx = db.buildings.findIndex((b) => b.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: '楼栋不存在' })
    return
  }
  db.buildings[idx] = {
    ...db.buildings[idx],
    ...req.body,
    updatedAt: new Date().toISOString(),
  }
  writeDB(db)
  res.json({ success: true, data: db.buildings[idx] })
})

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const idx = db.buildings.findIndex((b) => b.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: '楼栋不存在' })
    return
  }
  const hasRooms = db.rooms.some((r) => r.buildingId === req.params.id)
  if (hasRooms) {
    res.status(400).json({ success: false, error: '该楼栋下还有房间，无法删除' })
    return
  }
  db.buildings.splice(idx, 1)
  writeDB(db)
  res.json({ success: true })
})

export default router
