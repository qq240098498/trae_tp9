import { Router, type Request, type Response } from 'express'
import { readDB, writeDB, generateId } from '../lib/db.js'
import type { FeeSupplement, Receipt } from '../../src/types/index.ts'

const router = Router()

router.get('/supplements', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const { workerId, roomId, buildingId, type, status, startDate, endDate } = req.query
  let supplements = [...db.feeSupplements].sort(
    (a, b) => new Date(b.operatedAt).getTime() - new Date(a.operatedAt).getTime(),
  )
  if (workerId) {
    supplements = supplements.filter((s) => s.workerId === workerId)
  }
  if (roomId) {
    supplements = supplements.filter((s) => s.roomId === roomId)
  }
  if (buildingId) {
    supplements = supplements.filter((s) => s.buildingId === buildingId)
  }
  if (type) {
    supplements = supplements.filter((s) => s.type === type)
  }
  if (status) {
    supplements = supplements.filter((s) => s.status === status)
  }
  if (startDate) {
    supplements = supplements.filter((s) => new Date(s.operatedAt) >= new Date(String(startDate)))
  }
  if (endDate) {
    const end = new Date(String(endDate))
    end.setDate(end.getDate() + 1)
    supplements = supplements.filter((s) => new Date(s.operatedAt) < end)
  }
  res.json({ success: true, data: supplements })
})

router.get('/supplements/stats/summary', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const { type, status, startDate, endDate } = req.query
  let supplements = db.feeSupplements
  if (type) {
    supplements = supplements.filter((s) => s.type === type)
  }
  if (status) {
    supplements = supplements.filter((s) => s.status === status)
  }
  if (startDate) {
    supplements = supplements.filter((s) => new Date(s.operatedAt) >= new Date(String(startDate)))
  }
  if (endDate) {
    const end = new Date(String(endDate))
    end.setDate(end.getDate() + 1)
    supplements = supplements.filter((s) => new Date(s.operatedAt) < end)
  }

  const totalAmount = supplements.reduce((sum, s) => sum + s.amount, 0)
  const pendingAmount = supplements.filter((s) => s.status === 'pending').reduce((sum, s) => sum + s.amount, 0)
  const confirmedAmount = supplements.filter((s) => s.status === 'confirmed').reduce((sum, s) => sum + s.amount, 0)
  const paidAmount = supplements.filter((s) => s.status === 'paid').reduce((sum, s) => sum + s.amount, 0)

  const byType = supplements.reduce<Record<string, number>>((acc, s) => {
    acc[s.type] = (acc[s.type] || 0) + s.amount
    return acc
  }, {})

  res.json({
    success: true,
    data: {
      totalRecords: supplements.length,
      totalAmount,
      pendingAmount,
      confirmedAmount,
      paidAmount,
      byType,
    },
  })
})

router.get('/supplements/:id', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const supplement = db.feeSupplements.find((s) => s.id === req.params.id)
  if (!supplement) {
    res.status(404).json({ success: false, error: '补缴记录不存在' })
    return
  }
  res.json({ success: true, data: supplement })
})

router.post('/supplements', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const { workerId, roomId, type, amount, reason, relatedBillId, relatedArrearId, operator, remark } = req.body

  if (!type || amount === undefined || !reason) {
    res.status(400).json({ success: false, error: '请填写完整信息' })
    return
  }

  let workerName = ''
  let roomNumber = ''
  let buildingId = ''
  let buildingName = ''

  if (workerId) {
    const worker = db.workers.find((w) => w.id === workerId)
    if (worker) {
      workerName = worker.name
    }
  }

  if (roomId) {
    const room = db.rooms.find((r) => r.id === roomId)
    if (room) {
      roomNumber = room.roomNumber
      buildingId = room.buildingId
      const building = db.buildings.find((b) => b.id === room.buildingId)
      buildingName = building?.name || ''
    }
  }

  const now = new Date().toISOString()
  const newSupplement: FeeSupplement = {
    id: generateId('supplement'),
    workerId,
    workerName,
    roomId,
    roomNumber,
    buildingId,
    buildingName,
    type,
    amount: Number(amount),
    reason,
    relatedBillId,
    relatedArrearId,
    status: 'pending',
    operator: operator || '管理员',
    operatedAt: now,
    remark,
    createdAt: now,
    updatedAt: now,
  }

  db.feeSupplements.push(newSupplement)
  writeDB(db)
  res.json({ success: true, data: newSupplement })
})

router.put('/supplements/:id', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const idx = db.feeSupplements.findIndex((s) => s.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: '补缴记录不存在' })
    return
  }

  db.feeSupplements[idx] = {
    ...db.feeSupplements[idx],
    ...req.body,
    updatedAt: new Date().toISOString(),
  }
  writeDB(db)
  res.json({ success: true, data: db.feeSupplements[idx] })
})

router.put('/supplements/:id/confirm', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const idx = db.feeSupplements.findIndex((s) => s.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: '补缴记录不存在' })
    return
  }

  if (db.feeSupplements[idx].status !== 'pending') {
    res.status(400).json({ success: false, error: '只有待确认状态的记录可以确认' })
    return
  }

  db.feeSupplements[idx].status = 'confirmed'
  db.feeSupplements[idx].updatedAt = new Date().toISOString()
  writeDB(db)
  res.json({ success: true, data: db.feeSupplements[idx] })
})

router.put('/supplements/:id/pay', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const idx = db.feeSupplements.findIndex((s) => s.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: '补缴记录不存在' })
    return
  }

  if (db.feeSupplements[idx].status !== 'confirmed') {
    res.status(400).json({ success: false, error: '只有已确认状态的记录可以标记为已缴纳' })
    return
  }

  const { payMethod, transactionNo, receiptId } = req.body
  const now = new Date().toISOString()

  db.feeSupplements[idx].status = 'paid'
  db.feeSupplements[idx].paidAt = now
  db.feeSupplements[idx].payMethod = payMethod
  db.feeSupplements[idx].transactionNo = transactionNo
  db.feeSupplements[idx].updatedAt = now

  if (!receiptId) {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const existingCount = db.receipts.filter(
      (r) => r.receiptNo.startsWith(`RCP-${dateStr}-`),
    ).length
    const receiptNo = `RCP-${dateStr}-${String(existingCount + 1).padStart(4, '0')}`

    const supplement = db.feeSupplements[idx]
    const newReceipt: Receipt = {
      id: generateId('receipt'),
      receiptNo,
      type: 'supplement',
      payerId: supplement.workerId,
      payerName: supplement.workerName || '',
      payerType: 'worker',
      amount: supplement.amount,
      payMethod: payMethod || 'cash',
      transactionNo,
      items: [
        {
          name: supplement.type,
          description: supplement.reason,
          amount: supplement.amount,
          quantity: 1,
          unit: '项',
        },
      ],
      relatedRecordId: supplement.id,
      relatedRecordType: 'feeSupplement',
      operator: supplement.operator,
      issuedAt: now,
      printCount: 0,
      remark: supplement.remark,
      createdAt: now,
      updatedAt: now,
    }

    db.receipts.push(newReceipt)
    db.feeSupplements[idx].receiptId = newReceipt.id
  } else {
    db.feeSupplements[idx].receiptId = receiptId
  }

  writeDB(db)
  res.json({ success: true, data: db.feeSupplements[idx] })
})

router.delete('/supplements/:id', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const idx = db.feeSupplements.findIndex((s) => s.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: '补缴记录不存在' })
    return
  }
  db.feeSupplements.splice(idx, 1)
  writeDB(db)
  res.json({ success: true })
})

router.get('/receipts', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const { type, payerId, payerType, startDate, endDate } = req.query
  let receipts = [...db.receipts].sort(
    (a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime(),
  )
  if (type) {
    receipts = receipts.filter((r) => r.type === type)
  }
  if (payerId) {
    receipts = receipts.filter((r) => r.payerId === payerId)
  }
  if (payerType) {
    receipts = receipts.filter((r) => r.payerType === payerType)
  }
  if (startDate) {
    receipts = receipts.filter((r) => new Date(r.issuedAt) >= new Date(String(startDate)))
  }
  if (endDate) {
    const end = new Date(String(endDate))
    end.setDate(end.getDate() + 1)
    receipts = receipts.filter((r) => new Date(r.issuedAt) < end)
  }
  res.json({ success: true, data: receipts })
})

router.get('/receipts/stats/summary', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const { type, payerType, startDate, endDate } = req.query
  let receipts = db.receipts
  if (type) {
    receipts = receipts.filter((r) => r.type === type)
  }
  if (payerType) {
    receipts = receipts.filter((r) => r.payerType === payerType)
  }
  if (startDate) {
    receipts = receipts.filter((r) => new Date(r.issuedAt) >= new Date(String(startDate)))
  }
  if (endDate) {
    const end = new Date(String(endDate))
    end.setDate(end.getDate() + 1)
    receipts = receipts.filter((r) => new Date(r.issuedAt) < end)
  }

  const totalAmount = receipts.reduce((sum, r) => sum + r.amount, 0)

  const byType = receipts.reduce<Record<string, number>>((acc, r) => {
    acc[r.type] = (acc[r.type] || 0) + r.amount
    return acc
  }, {})

  const byPayMethod = receipts.reduce<Record<string, number>>((acc, r) => {
    acc[r.payMethod] = (acc[r.payMethod] || 0) + r.amount
    return acc
  }, {})

  res.json({
    success: true,
    data: {
      totalReceipts: receipts.length,
      totalAmount,
      byType,
      byPayMethod,
    },
  })
})

router.get('/receipts/:id', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const receipt = db.receipts.find((r) => r.id === req.params.id)
  if (!receipt) {
    res.status(404).json({ success: false, error: '收据不存在' })
    return
  }
  res.json({ success: true, data: receipt })
})

router.post('/receipts', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const {
    type, payerId, payerName, payerType, amount, payMethod,
    transactionNo, items, relatedRecordId, relatedRecordType, operator, remark,
  } = req.body

  if (!type || !payerName || !payerType || amount === undefined || !payMethod || !items?.length) {
    res.status(400).json({ success: false, error: '请填写完整信息' })
    return
  }

  const now = new Date().toISOString()
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const existingCount = db.receipts.filter(
    (r) => r.receiptNo.startsWith(`RCP-${dateStr}-`),
  ).length
  const receiptNo = `RCP-${dateStr}-${String(existingCount + 1).padStart(4, '0')}`

  const newReceipt: Receipt = {
    id: generateId('receipt'),
    receiptNo,
    type,
    payerId,
    payerName,
    payerType,
    amount: Number(amount),
    payMethod,
    transactionNo,
    items,
    relatedRecordId,
    relatedRecordType,
    operator: operator || '管理员',
    issuedAt: now,
    printCount: 0,
    remark,
    createdAt: now,
    updatedAt: now,
  }

  db.receipts.push(newReceipt)
  writeDB(db)
  res.json({ success: true, data: newReceipt })
})

router.put('/receipts/:id', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const idx = db.receipts.findIndex((r) => r.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: '收据不存在' })
    return
  }

  db.receipts[idx] = {
    ...db.receipts[idx],
    ...req.body,
    updatedAt: new Date().toISOString(),
  }
  writeDB(db)
  res.json({ success: true, data: db.receipts[idx] })
})

router.put('/receipts/:id/print', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const idx = db.receipts.findIndex((r) => r.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: '收据不存在' })
    return
  }

  db.receipts[idx].printCount += 1
  db.receipts[idx].printedAt = new Date().toISOString()
  db.receipts[idx].updatedAt = new Date().toISOString()
  writeDB(db)
  res.json({ success: true, data: db.receipts[idx] })
})

router.delete('/receipts/:id', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const idx = db.receipts.findIndex((r) => r.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: '收据不存在' })
    return
  }
  db.receipts.splice(idx, 1)
  writeDB(db)
  res.json({ success: true })
})

export default router
