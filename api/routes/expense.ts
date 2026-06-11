import { Router, type Request, type Response } from 'express'
import { readDB, writeDB, generateId } from '../lib/db.js'
import type { ExpenseLedger } from '../../src/types/index.ts'

const router = Router()

router.get('/ledgers', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const { type, roomId, buildingId, status, startDate, endDate, billingPeriod } = req.query
  let ledgers = [...db.expenseLedgers].sort(
    (a, b) => new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime(),
  )
  if (type) {
    ledgers = ledgers.filter((l) => l.type === type)
  }
  if (roomId) {
    ledgers = ledgers.filter((l) => l.roomId === roomId)
  }
  if (buildingId) {
    ledgers = ledgers.filter((l) => l.buildingId === buildingId)
  }
  if (status) {
    ledgers = ledgers.filter((l) => l.status === status)
  }
  if (billingPeriod) {
    ledgers = ledgers.filter((l) => l.billingPeriod === billingPeriod)
  }
  if (startDate) {
    ledgers = ledgers.filter((l) => new Date(l.recordDate) >= new Date(String(startDate)))
  }
  if (endDate) {
    const end = new Date(String(endDate))
    end.setDate(end.getDate() + 1)
    ledgers = ledgers.filter((l) => new Date(l.recordDate) < end)
  }
  res.json({ success: true, data: ledgers })
})

router.get('/ledgers/:id', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const ledger = db.expenseLedgers.find((l) => l.id === req.params.id)
  if (!ledger) {
    res.status(404).json({ success: false, error: '台账记录不存在' })
    return
  }
  res.json({ success: true, data: ledger })
})

router.post('/ledgers', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const { type, roomId, workerId, amount, description, billingPeriod, recordDate, operator, status, remark } = req.body

  if (!type || amount === undefined || !description || !recordDate) {
    res.status(400).json({ success: false, error: '请填写完整信息' })
    return
  }

  let roomNumber = ''
  let buildingId = ''
  let buildingName = ''
  let workerName = ''

  if (roomId) {
    const room = db.rooms.find((r) => r.id === roomId)
    if (room) {
      roomNumber = room.roomNumber
      buildingId = room.buildingId
      const building = db.buildings.find((b) => b.id === room.buildingId)
      buildingName = building?.name || ''
    }
  }

  if (workerId) {
    const worker = db.workers.find((w) => w.id === workerId)
    if (worker) {
      workerName = worker.name
    }
  }

  const now = new Date().toISOString()
  const newLedger: ExpenseLedger = {
    id: generateId('ledger'),
    type,
    roomId,
    roomNumber,
    buildingId,
    buildingName,
    workerId,
    workerName,
    amount: Number(amount),
    description,
    billingPeriod,
    recordDate,
    operator: operator || '管理员',
    status: status || 'pending',
    remark,
    createdAt: now,
    updatedAt: now,
  }

  db.expenseLedgers.push(newLedger)
  writeDB(db)
  res.json({ success: true, data: newLedger })
})

router.put('/ledgers/:id', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const idx = db.expenseLedgers.findIndex((l) => l.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: '台账记录不存在' })
    return
  }

  db.expenseLedgers[idx] = {
    ...db.expenseLedgers[idx],
    ...req.body,
    updatedAt: new Date().toISOString(),
  }
  writeDB(db)
  res.json({ success: true, data: db.expenseLedgers[idx] })
})

router.delete('/ledgers/:id', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const idx = db.expenseLedgers.findIndex((l) => l.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: '台账记录不存在' })
    return
  }
  db.expenseLedgers.splice(idx, 1)
  writeDB(db)
  res.json({ success: true })
})

router.get('/ledgers/export', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const { type, roomId, buildingId, status, startDate, endDate, billingPeriod, format } = req.query
  let ledgers = [...db.expenseLedgers].sort(
    (a, b) => new Date(a.recordDate).getTime() - new Date(b.recordDate).getTime(),
  )
  if (type) {
    ledgers = ledgers.filter((l) => l.type === type)
  }
  if (roomId) {
    ledgers = ledgers.filter((l) => l.roomId === roomId)
  }
  if (buildingId) {
    ledgers = ledgers.filter((l) => l.buildingId === buildingId)
  }
  if (status) {
    ledgers = ledgers.filter((l) => l.status === status)
  }
  if (billingPeriod) {
    ledgers = ledgers.filter((l) => l.billingPeriod === billingPeriod)
  }
  if (startDate) {
    ledgers = ledgers.filter((l) => new Date(l.recordDate) >= new Date(String(startDate)))
  }
  if (endDate) {
    const end = new Date(String(endDate))
    end.setDate(end.getDate() + 1)
    ledgers = ledgers.filter((l) => new Date(l.recordDate) < end)
  }

  const typeLabels: Record<string, string> = {
    electricity: '电费',
    water: '水费',
    room: '房费',
    other: '其他',
  }

  const statusLabels: Record<string, string> = {
    pending: '待确认',
    confirmed: '已确认',
    paid: '已缴费',
  }

  if (format === 'csv') {
    const headers = ['日期', '类型', '楼栋', '房间', '工人', '金额(元)', '描述', '账期', '状态', '操作员', '备注']
    const rows = ledgers.map((l) => [
      l.recordDate,
      typeLabels[l.type] || l.type,
      l.buildingName || '',
      l.roomNumber || '',
      l.workerName || '',
      l.amount.toFixed(2),
      l.description,
      l.billingPeriod || '',
      statusLabels[l.status] || l.status,
      l.operator,
      l.remark || '',
    ])

    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="expense-ledger-${Date.now()}.csv"`)
    res.send('\uFEFF' + csvContent)
    return
  }

  res.json({ success: true, data: ledgers })
})

router.get('/stats/summary', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const { type, startDate, endDate, billingPeriod } = req.query

  let ledgers = db.expenseLedgers
  if (type) {
    ledgers = ledgers.filter((l) => l.type === type)
  }
  if (billingPeriod) {
    ledgers = ledgers.filter((l) => l.billingPeriod === billingPeriod)
  }
  if (startDate) {
    ledgers = ledgers.filter((l) => new Date(l.recordDate) >= new Date(String(startDate)))
  }
  if (endDate) {
    const end = new Date(String(endDate))
    end.setDate(end.getDate() + 1)
    ledgers = ledgers.filter((l) => new Date(l.recordDate) < end)
  }

  const totalAmount = ledgers.reduce((sum, l) => sum + l.amount, 0)
  const pendingAmount = ledgers.filter((l) => l.status === 'pending').reduce((sum, l) => sum + l.amount, 0)
  const confirmedAmount = ledgers.filter((l) => l.status === 'confirmed').reduce((sum, l) => sum + l.amount, 0)
  const paidAmount = ledgers.filter((l) => l.status === 'paid').reduce((sum, l) => sum + l.amount, 0)

  const byType = ledgers.reduce<Record<string, number>>((acc, l) => {
    acc[l.type] = (acc[l.type] || 0) + l.amount
    return acc
  }, {})

  const byBuilding = ledgers.reduce<Record<string, number>>((acc, l) => {
    if (l.buildingName) {
      acc[l.buildingName] = (acc[l.buildingName] || 0) + l.amount
    }
    return acc
  }, {})

  res.json({
    success: true,
    data: {
      totalRecords: ledgers.length,
      totalAmount,
      pendingAmount,
      confirmedAmount,
      paidAmount,
      byType,
      byBuilding,
    },
  })
})

export default router
