import { Router, type Request, type Response } from 'express'
import { readDB, writeDB, generateId } from '../lib/db.js'
import type { UtilityBill, ExpenseLedger } from '../../src/types/index.ts'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const { roomId, buildingId, status, startDate, endDate, billingPeriod } = req.query
  let bills = [...db.utilityBills].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
  if (roomId) {
    bills = bills.filter((b) => b.roomId === roomId)
  }
  if (buildingId) {
    bills = bills.filter((b) => b.buildingId === buildingId)
  }
  if (status) {
    bills = bills.filter((b) => b.status === status)
  }
  if (billingPeriod) {
    bills = bills.filter((b) => b.billingPeriod === billingPeriod)
  }
  if (startDate) {
    bills = bills.filter((b) => new Date(b.startDate) >= new Date(String(startDate)))
  }
  if (endDate) {
    const end = new Date(String(endDate))
    end.setDate(end.getDate() + 1)
    bills = bills.filter((b) => new Date(b.endDate) < end)
  }
  res.json({ success: true, data: bills })
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const bill = db.utilityBills.find((b) => b.id === req.params.id)
  if (!bill) {
    res.status(404).json({ success: false, error: '账单不存在' })
    return
  }
  res.json({ success: true, data: bill })
})

router.post('/generate', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const { readingId, operator } = req.body

  if (!readingId) {
    res.status(400).json({ success: false, error: '请选择抄表记录' })
    return
  }

  const reading = db.utilityReadings.find((r) => r.id === readingId)
  if (!reading) {
    res.status(404).json({ success: false, error: '抄表记录不存在' })
    return
  }

  const existingBill = db.utilityBills.find((b) => b.readingId === readingId)
  if (existingBill) {
    res.status(400).json({ success: false, error: '该抄表记录已生成账单' })
    return
  }

  const price = db.utilityPrice
  const electricityCost = Number((reading.electricityUsage * price.electricityPrice).toFixed(2))
  const waterCost = Number((reading.waterUsage * price.waterPrice).toFixed(2))
  const totalCost = Number((electricityCost + waterCost).toFixed(2))

  const readingDate = new Date(reading.readingDate)
  const billingPeriod = `${readingDate.getFullYear()}-${String(readingDate.getMonth() + 1).padStart(2, '0')}`

  const lastMonth = new Date(readingDate)
  lastMonth.setMonth(lastMonth.getMonth() - 1)
  const startDate = lastMonth.toISOString().split('T')[0]
  const endDate = readingDate.toISOString().split('T')[0]

  const now = new Date().toISOString()
  const newBill: UtilityBill = {
    id: generateId('bill'),
    roomId: reading.roomId,
    roomNumber: reading.roomNumber,
    buildingId: reading.buildingId,
    buildingName: reading.buildingName,
    billingPeriod,
    startDate,
    endDate,
    electricityUsage: reading.electricityUsage,
    waterUsage: reading.waterUsage,
    electricityCost,
    waterCost,
    totalCost,
    readingId,
    status: 'pending',
    operator: operator || '管理员',
    createdAt: now,
    updatedAt: now,
  }

  db.utilityBills.push(newBill)
  writeDB(db)
  res.json({ success: true, data: newBill })
})

router.post('/batch-generate', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const { readingIds, operator } = req.body

  if (!readingIds || readingIds.length === 0) {
    res.status(400).json({ success: false, error: '请选择抄表记录' })
    return
  }

  const generatedBills: UtilityBill[] = []
  const errors: string[] = []

  for (const readingId of readingIds) {
    const reading = db.utilityReadings.find((r) => r.id === readingId)
    if (!reading) {
      errors.push(`抄表记录 ${readingId} 不存在`)
      continue
    }

    const existingBill = db.utilityBills.find((b) => b.readingId === readingId)
    if (existingBill) {
      errors.push(`抄表记录 ${readingId} 已生成账单`)
      continue
    }

    const price = db.utilityPrice
    const electricityCost = Number((reading.electricityUsage * price.electricityPrice).toFixed(2))
    const waterCost = Number((reading.waterUsage * price.waterPrice).toFixed(2))
    const totalCost = Number((electricityCost + waterCost).toFixed(2))

    const readingDate = new Date(reading.readingDate)
    const billingPeriod = `${readingDate.getFullYear()}-${String(readingDate.getMonth() + 1).padStart(2, '0')}`

    const lastMonth = new Date(readingDate)
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    const startDate = lastMonth.toISOString().split('T')[0]
    const endDate = readingDate.toISOString().split('T')[0]

    const now = new Date().toISOString()
    const newBill: UtilityBill = {
      id: generateId('bill'),
      roomId: reading.roomId,
      roomNumber: reading.roomNumber,
      buildingId: reading.buildingId,
      buildingName: reading.buildingName,
      billingPeriod,
      startDate,
      endDate,
      electricityUsage: reading.electricityUsage,
      waterUsage: reading.waterUsage,
      electricityCost,
      waterCost,
      totalCost,
      readingId,
      status: 'pending',
      operator: operator || '管理员',
      createdAt: now,
      updatedAt: now,
    }

    db.utilityBills.push(newBill)
    generatedBills.push(newBill)
  }

  writeDB(db)
  res.json({ success: true, data: { generated: generatedBills, errors } })
})

router.put('/:id/confirm', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const idx = db.utilityBills.findIndex((b) => b.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: '账单不存在' })
    return
  }

  const bill = db.utilityBills[idx]
  if (bill.status !== 'pending') {
    res.status(400).json({ success: false, error: '该账单状态不允许确认' })
    return
  }

  const now = new Date().toISOString()
  db.utilityBills[idx] = {
    ...bill,
    status: 'confirmed',
    confirmedAt: now,
    updatedAt: now,
  }

  const ledgerEntry: ExpenseLedger = {
    id: generateId('ledger'),
    type: 'electricity',
    roomId: bill.roomId,
    roomNumber: bill.roomNumber,
    buildingId: bill.buildingId,
    buildingName: bill.buildingName,
    amount: bill.totalCost,
    description: `${bill.billingPeriod} 水电费账单 - ${bill.roomNumber}`,
    billingPeriod: bill.billingPeriod,
    recordDate: now,
    operator: bill.operator || '管理员',
    status: 'confirmed',
    relatedBillId: bill.id,
    createdAt: now,
    updatedAt: now,
  }

  db.expenseLedgers.push(ledgerEntry)
  writeDB(db)
  res.json({ success: true, data: db.utilityBills[idx] })
})

router.put('/:id/pay', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const idx = db.utilityBills.findIndex((b) => b.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: '账单不存在' })
    return
  }

  const bill = db.utilityBills[idx]
  if (bill.status === 'pending') {
    res.status(400).json({ success: false, error: '请先确认账单' })
    return
  }
  if (bill.status === 'paid') {
    res.status(400).json({ success: false, error: '该账单已缴费' })
    return
  }

  const now = new Date().toISOString()
  db.utilityBills[idx] = {
    ...bill,
    status: 'paid',
    paidAt: now,
    updatedAt: now,
  }

  const ledgerIdx = db.expenseLedgers.findIndex((l) => l.relatedBillId === bill.id)
  if (ledgerIdx !== -1) {
    db.expenseLedgers[ledgerIdx] = {
      ...db.expenseLedgers[ledgerIdx],
      status: 'paid',
      updatedAt: now,
    }
  }

  writeDB(db)
  res.json({ success: true, data: db.utilityBills[idx] })
})

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const idx = db.utilityBills.findIndex((b) => b.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: '账单不存在' })
    return
  }

  if (db.utilityBills[idx].status !== 'pending') {
    res.status(400).json({ success: false, error: '只能编辑待确认状态的账单' })
    return
  }

  db.utilityBills[idx] = {
    ...db.utilityBills[idx],
    ...req.body,
    updatedAt: new Date().toISOString(),
  }
  writeDB(db)
  res.json({ success: true, data: db.utilityBills[idx] })
})

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const idx = db.utilityBills.findIndex((b) => b.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: '账单不存在' })
    return
  }

  if (db.utilityBills[idx].status !== 'pending') {
    res.status(400).json({ success: false, error: '只能删除待确认状态的账单' })
    return
  }

  db.utilityBills.splice(idx, 1)
  db.expenseLedgers = db.expenseLedgers.filter((l) => l.relatedBillId !== req.params.id)
  writeDB(db)
  res.json({ success: true })
})

router.get('/stats/summary', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const { billingPeriod, buildingId } = req.query

  let bills = db.utilityBills
  if (billingPeriod) {
    bills = bills.filter((b) => b.billingPeriod === billingPeriod)
  }
  if (buildingId) {
    bills = bills.filter((b) => b.buildingId === buildingId)
  }

  const totalElectricityUsage = bills.reduce((sum, b) => sum + b.electricityUsage, 0)
  const totalWaterUsage = bills.reduce((sum, b) => sum + b.waterUsage, 0)
  const totalElectricityCost = bills.reduce((sum, b) => sum + b.electricityCost, 0)
  const totalWaterCost = bills.reduce((sum, b) => sum + b.waterCost, 0)
  const totalCost = bills.reduce((sum, b) => sum + b.totalCost, 0)
  const pendingCount = bills.filter((b) => b.status === 'pending').length
  const confirmedCount = bills.filter((b) => b.status === 'confirmed').length
  const paidCount = bills.filter((b) => b.status === 'paid').length

  res.json({
    success: true,
    data: {
      totalBills: bills.length,
      totalElectricityUsage,
      totalWaterUsage,
      totalElectricityCost,
      totalWaterCost,
      totalCost,
      pendingCount,
      confirmedCount,
      paidCount,
    },
  })
})

export default router
