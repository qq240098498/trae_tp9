import { Router, type Request, type Response } from 'express'
import { readDB, writeDB, generateId } from '../lib/db.js'

const router = Router()

router.post('/checkin', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const { workerId, bedId, operator, reason } = req.body
  const worker = db.workers.find((w) => w.id === workerId)
  if (!worker) {
    res.status(404).json({ success: false, error: '工人不存在' })
    return
  }
  if (worker.bedId) {
    res.status(400).json({ success: false, error: '该工人已入住，请先办理退宿或调房' })
    return
  }
  const bed = db.beds.find((b) => b.id === bedId)
  if (!bed) {
    res.status(404).json({ success: false, error: '床位不存在' })
    return
  }
  if (bed.status !== 'available') {
    res.status(400).json({ success: false, error: '该床位不可用' })
    return
  }
  const room = db.rooms.find((r) => r.id === bed.roomId)
  const now = new Date().toISOString()

  const bedIdx = db.beds.findIndex((b) => b.id === bedId)
  db.beds[bedIdx] = { ...bed, status: 'occupied', workerId }

  const workerIdx = db.workers.findIndex((w) => w.id === workerId)
  db.workers[workerIdx] = {
    ...worker,
    bedId,
    roomId: bed.roomId,
    checkInDate: now,
    updatedAt: now,
  }

  db.records.push({
    id: generateId('rec'),
    type: 'checkin',
    workerId,
    workerName: worker.name,
    bedId,
    roomNumber: room?.roomNumber,
    reason: reason || '新工人入住',
    operator: operator || '管理员',
    operatedAt: now,
  })

  writeDB(db)
  res.json({ success: true, message: '入住办理成功' })
})

router.post('/checkout', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const { workerId, operator, reason } = req.body
  const worker = db.workers.find((w) => w.id === workerId)
  if (!worker) {
    res.status(404).json({ success: false, error: '工人不存在' })
    return
  }
  if (!worker.bedId) {
    res.status(400).json({ success: false, error: '该工人未入住' })
    return
  }
  const bed = db.beds.find((b) => b.id === worker.bedId)
  const room = bed ? db.rooms.find((r) => r.id === bed.roomId) : null
  const now = new Date().toISOString()

  if (bed) {
    const bedIdx = db.beds.findIndex((b) => b.id === worker.bedId)
    db.beds[bedIdx] = { ...bed, status: 'available', workerId: undefined }
  }

  const workerIdx = db.workers.findIndex((w) => w.id === workerId)
  db.workers[workerIdx] = {
    ...worker,
    bedId: undefined,
    roomId: undefined,
    checkInDate: undefined,
    updatedAt: now,
  }

  db.records.push({
    id: generateId('rec'),
    type: 'checkout',
    workerId,
    workerName: worker.name,
    bedId: worker.bedId,
    roomNumber: room?.roomNumber,
    reason: reason || '正常退宿',
    operator: operator || '管理员',
    operatedAt: now,
  })

  writeDB(db)
  res.json({ success: true, message: '退宿办理成功' })
})

router.post('/transfer', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const { workerId, toBedId, operator, reason } = req.body
  const worker = db.workers.find((w) => w.id === workerId)
  if (!worker) {
    res.status(404).json({ success: false, error: '工人不存在' })
    return
  }
  if (!worker.bedId) {
    res.status(400).json({ success: false, error: '该工人未入住，无法调房' })
    return
  }
  const fromBed = db.beds.find((b) => b.id === worker.bedId)
  const toBed = db.beds.find((b) => b.id === toBedId)
  if (!toBed) {
    res.status(404).json({ success: false, error: '目标床位不存在' })
    return
  }
  if (toBed.status !== 'available') {
    res.status(400).json({ success: false, error: '目标床位不可用' })
    return
  }
  if (worker.bedId === toBedId) {
    res.status(400).json({ success: false, error: '不能调至当前床位' })
    return
  }
  const fromRoom = fromBed ? db.rooms.find((r) => r.id === fromBed.roomId) : null
  const toRoom = db.rooms.find((r) => r.id === toBed.roomId)
  const now = new Date().toISOString()

  if (fromBed) {
    const fromBedIdx = db.beds.findIndex((b) => b.id === worker.bedId)
    db.beds[fromBedIdx] = { ...fromBed, status: 'available', workerId: undefined }
  }

  const toBedIdx = db.beds.findIndex((b) => b.id === toBedId)
  db.beds[toBedIdx] = { ...toBed, status: 'occupied', workerId }

  const workerIdx = db.workers.findIndex((w) => w.id === workerId)
  db.workers[workerIdx] = {
    ...worker,
    bedId: toBedId,
    roomId: toBed.roomId,
    updatedAt: now,
  }

  db.records.push({
    id: generateId('rec'),
    type: 'transfer',
    workerId,
    workerName: worker.name,
    fromBedId: worker.bedId,
    fromRoomNumber: fromRoom?.roomNumber,
    toBedId,
    toRoomNumber: toRoom?.roomNumber,
    reason: reason || '调房',
    operator: operator || '管理员',
    operatedAt: now,
  })

  writeDB(db)
  res.json({ success: true, message: '调房办理成功' })
})

router.get('/records', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const { type, workerId, startDate, endDate } = req.query
  let records = [...db.records].sort(
    (a, b) => new Date(b.operatedAt).getTime() - new Date(a.operatedAt).getTime(),
  )
  if (type) {
    records = records.filter((r) => r.type === type)
  }
  if (workerId) {
    records = records.filter((r) => r.workerId === workerId)
  }
  if (startDate) {
    records = records.filter((r) => new Date(r.operatedAt) >= new Date(String(startDate)))
  }
  if (endDate) {
    const end = new Date(String(endDate))
    end.setDate(end.getDate() + 1)
    records = records.filter((r) => new Date(r.operatedAt) < end)
  }
  res.json({ success: true, data: records })
})

router.get('/stats/overview', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const totalBeds = db.beds.length
  const occupiedBeds = db.beds.filter((b) => b.status === 'occupied').length
  const availableBeds = db.beds.filter((b) => b.status === 'available').length
  const maintenanceBeds = db.beds.filter((b) => b.status === 'maintenance').length
  const totalWorkers = db.workers.length
  const activeWorkers = db.workers.filter((w) => w.status === 'active').length
  const checkedInWorkers = db.workers.filter((w) => w.bedId).length
  const totalRooms = db.rooms.length
  const normalRooms = db.rooms.filter((r) => r.status === 'normal').length
  const maintenanceRooms = db.rooms.filter((r) => r.status === 'maintenance').length
  const cleaningRooms = db.rooms.filter((r) => r.status === 'cleaning').length
  const totalBuildings = db.buildings.length
  const teamStats = db.workers.reduce<Record<string, number>>((acc, w) => {
    acc[w.team] = (acc[w.team] || 0) + 1
    return acc
  }, {})
  const buildingStats = db.buildings.map((b) => {
    const rooms = db.rooms.filter((r) => r.buildingId === b.id)
    const beds = db.beds.filter((bed) => rooms.some((r) => r.id === bed.roomId))
    const occupied = beds.filter((bed) => bed.status === 'occupied').length
    return {
      id: b.id,
      name: b.name,
      roomCount: rooms.length,
      bedCount: beds.length,
      occupiedCount: occupied,
      occupancyRate: beds.length > 0 ? Math.round((occupied / beds.length) * 100) : 0,
    }
  })
  res.json({
    success: true,
    data: {
      totalBeds,
      occupiedBeds,
      availableBeds,
      maintenanceBeds,
      totalWorkers,
      activeWorkers,
      checkedInWorkers,
      totalRooms,
      normalRooms,
      maintenanceRooms,
      cleaningRooms,
      totalBuildings,
      teamStats,
      buildingStats,
    },
  })
})

export default router
