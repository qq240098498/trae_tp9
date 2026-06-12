import { Router, type Request, type Response } from 'express'
import { readDB, writeDB, generateId } from '../lib/db.js'
import type { UtilityArrear, CollectionRecord, UtilityBill } from '../../src/types/index.ts'

const router = Router()

function calculateOverdueDays(dueDate: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  const diffTime = today.getTime() - due.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

function getWarningLevel(overdueDays: number): UtilityArrear['warningLevel'] {
  if (overdueDays <= 0) return 'normal'
  if (overdueDays <= 7) return 'warning'
  if (overdueDays <= 15) return 'urgent'
  return 'critical'
}

function calculateDueDate(bill: UtilityBill): string {
  const endDate = new Date(bill.endDate)
  endDate.setDate(endDate.getDate() + 15)
  return endDate.toISOString().split('T')[0]
}

function updateArrearStatus(arrear: UtilityArrear): UtilityArrear {
  const overdueDays = calculateOverdueDays(arrear.dueDate)
  const warningLevel = getWarningLevel(overdueDays)

  let status = arrear.status
  if (arrear.paidAmount >= arrear.totalAmount) {
    status = 'paid'
  } else if (arrear.paidAmount > 0) {
    status = 'partial_paid'
  } else if (arrear.collectionCount > 0) {
    status = 'collecting'
  }

  return {
    ...arrear,
    overdueDays,
    warningLevel,
    status,
  }
}

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const { roomId, buildingId, status, warningLevel, billingPeriod, startDate, endDate } = req.query

  let arrears = db.utilityArrears.map((a) => updateArrearStatus(a))
  arrears.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  if (roomId) {
    arrears = arrears.filter((a) => a.roomId === roomId)
  }
  if (buildingId) {
    arrears = arrears.filter((a) => a.buildingId === buildingId)
  }
  if (status) {
    arrears = arrears.filter((a) => a.status === status)
  }
  if (warningLevel) {
    arrears = arrears.filter((a) => a.warningLevel === warningLevel)
  }
  if (billingPeriod) {
    arrears = arrears.filter((a) => a.billingPeriod === billingPeriod)
  }
  if (startDate) {
    arrears = arrears.filter((a) => new Date(a.dueDate) >= new Date(String(startDate)))
  }
  if (endDate) {
    const end = new Date(String(endDate))
    end.setDate(end.getDate() + 1)
    arrears = arrears.filter((a) => new Date(a.dueDate) < end)
  }

  res.json({ success: true, data: arrears })
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  let arrear = db.utilityArrears.find((a) => a.id === req.params.id)
  if (!arrear) {
    res.status(404).json({ success: false, error: '欠费记录不存在' })
    return
  }
  arrear = updateArrearStatus(arrear)
  res.json({ success: true, data: arrear })
})

router.get('/:id/collections', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const collections = db.collectionRecords
    .filter((c) => c.arrearId === req.params.id)
    .sort((a, b) => new Date(b.operatedAt).getTime() - new Date(a.operatedAt).getTime())
  res.json({ success: true, data: collections })
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const { billId, workerIds, remark } = req.body

  if (!billId) {
    res.status(400).json({ success: false, error: '请提供账单ID' })
    return
  }

  const bill = db.utilityBills.find((b) => b.id === billId)
  if (!bill) {
    res.status(404).json({ success: false, error: '账单不存在' })
    return
  }

  const existing = db.utilityArrears.find((a) => a.billId === billId && a.status !== 'written_off')
  if (existing) {
    res.status(400).json({ success: false, error: '该账单已存在欠费记录' })
    return
  }

  const dueDate = calculateDueDate(bill)
  const now = new Date().toISOString()

  const workerNames: string[] = []
  if (workerIds && Array.isArray(workerIds)) {
    for (const wid of workerIds) {
      const worker = db.workers.find((w) => w.id === wid)
      if (worker) {
        workerNames.push(worker.name)
      }
    }
  }

  const newArrear: UtilityArrear = {
    id: generateId('arrear'),
    billId: bill.id,
    roomId: bill.roomId,
    roomNumber: bill.roomNumber,
    buildingId: bill.buildingId,
    buildingName: bill.buildingName,
    billingPeriod: bill.billingPeriod,
    totalAmount: bill.totalCost,
    paidAmount: 0,
    unpaidAmount: bill.totalCost,
    dueDate,
    overdueDays: calculateOverdueDays(dueDate),
    warningLevel: getWarningLevel(calculateOverdueDays(dueDate)),
    status: 'pending',
    workerIds: workerIds || [],
    workerNames,
    collectionCount: 0,
    remark,
    createdAt: now,
    updatedAt: now,
  }

  db.utilityArrears.push(newArrear)
  writeDB(db)
  res.json({ success: true, data: newArrear })
})

router.post('/:id/collect', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const idx = db.utilityArrears.findIndex((a) => a.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: '欠费记录不存在' })
    return
  }

  const { collectionType, content, operator, workerId, response, effect, remark } = req.body

  if (!collectionType || !content || !operator) {
    res.status(400).json({ success: false, error: '请填写完整催收信息' })
    return
  }

  const arrear = db.utilityArrears[idx]
  const now = new Date().toISOString()

  let workerName = ''
  if (workerId) {
    const worker = db.workers.find((w) => w.id === workerId)
    if (worker) {
      workerName = worker.name
    }
  }

  const newRecord: CollectionRecord = {
    id: generateId('collection'),
    arrearId: arrear.id,
    billId: arrear.billId,
    roomId: arrear.roomId,
    roomNumber: arrear.roomNumber,
    workerId,
    workerName,
    collectionType,
    content,
    operator,
    operatedAt: now,
    response,
    effect,
    remark,
    createdAt: now,
  }

  db.collectionRecords.push(newRecord)

  arrear.collectionCount += 1
  arrear.lastCollectionAt = now
  if (arrear.status === 'pending') {
    arrear.status = 'collecting'
  }
  arrear.updatedAt = now

  db.utilityArrears[idx] = updateArrearStatus(arrear)

  writeDB(db)
  res.json({ success: true, data: { arrear: db.utilityArrears[idx], record: newRecord } })
})

router.put('/:id/pay', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const idx = db.utilityArrears.findIndex((a) => a.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: '欠费记录不存在' })
    return
  }

  const { paidAmount } = req.body
  if (paidAmount === undefined || paidAmount <= 0) {
    res.status(400).json({ success: false, error: '请输入有效缴费金额' })
    return
  }

  const arrear = db.utilityArrears[idx]
  arrear.paidAmount += Number(paidAmount)
  arrear.unpaidAmount = Math.max(0, arrear.totalAmount - arrear.paidAmount)
  arrear.updatedAt = new Date().toISOString()

  db.utilityArrears[idx] = updateArrearStatus(arrear)

  writeDB(db)
  res.json({ success: true, data: db.utilityArrears[idx] })
})

router.put('/:id/write-off', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const idx = db.utilityArrears.findIndex((a) => a.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: '欠费记录不存在' })
    return
  }

  const arrear = db.utilityArrears[idx]
  arrear.status = 'written_off'
  arrear.updatedAt = new Date().toISOString()

  writeDB(db)
  res.json({ success: true, data: arrear })
})

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const idx = db.utilityArrears.findIndex((a) => a.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: '欠费记录不存在' })
    return
  }
  db.utilityArrears.splice(idx, 1)
  writeDB(db)
  res.json({ success: true })
})

export default router
