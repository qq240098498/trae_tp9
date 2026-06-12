import { Router, type Request, type Response } from 'express'
import { readDB, writeDB, generateId } from '../lib/db.js'
import type { Deposit, DepositAccount } from '../../src/types/index.ts'

const router = Router()

router.get('/accounts', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const { workerId, status, keyword } = req.query
  let accounts = [...db.depositAccounts]

  if (workerId) {
    accounts = accounts.filter((a) => a.workerId === workerId)
  }
  if (status) {
    accounts = accounts.filter((a) => a.status === status)
  }
  if (keyword) {
    const kw = String(keyword).toLowerCase()
    accounts = accounts.filter(
      (a) =>
        a.workerName.toLowerCase().includes(kw) ||
        a.workerPhone.toLowerCase().includes(kw),
    )
  }

  accounts = accounts.map((a) => {
    const worker = db.workers.find((w) => w.id === a.workerId)
    if (worker?.roomId) {
      const room = db.rooms.find((r) => r.id === worker.roomId)
      if (room) {
        return { ...a, roomId: worker.roomId, roomNumber: room.roomNumber }
      }
    }
    return a
  })

  res.json({ success: true, data: accounts })
})

router.get('/accounts/:workerId', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const account = db.depositAccounts.find((a) => a.workerId === req.params.workerId)
  if (!account) {
    res.status(404).json({ success: false, error: '押金账户不存在' })
    return
  }
  res.json({ success: true, data: account })
})

router.post('/accounts/initialize', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const { workerId, remark } = req.body

  if (!workerId) {
    res.status(400).json({ success: false, error: '请提供工人ID' })
    return
  }

  const existing = db.depositAccounts.find((a) => a.workerId === workerId)
  if (existing) {
    res.status(400).json({ success: false, error: '该工人已有押金账户' })
    return
  }

  const worker = db.workers.find((w) => w.id === workerId)
  if (!worker) {
    res.status(404).json({ success: false, error: '工人不存在' })
    return
  }

  let roomId: string | undefined
  let roomNumber: string | undefined
  if (worker.roomId) {
    const room = db.rooms.find((r) => r.id === worker.roomId)
    if (room) {
      roomId = worker.roomId
      roomNumber = room.roomNumber
    }
  }

  const now = new Date().toISOString()
  const account: DepositAccount = {
    workerId,
    workerName: worker.name,
    workerPhone: worker.phone,
    roomId,
    roomNumber,
    totalReceived: 0,
    totalRefunded: 0,
    totalDeducted: 0,
    balance: 0,
    status: 'active',
    remark,
    createdAt: now,
    updatedAt: now,
  }

  db.depositAccounts.push(account)
  writeDB(db)
  res.json({ success: true, data: account })
})

router.put('/accounts/:workerId', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const idx = db.depositAccounts.findIndex((a) => a.workerId === req.params.workerId)
  if (idx === -1) {
    res.status(404).json({ success: false, error: '押金账户不存在' })
    return
  }

  const { status, remark } = req.body
  db.depositAccounts[idx] = {
    ...db.depositAccounts[idx],
    ...(status !== undefined && { status }),
    ...(remark !== undefined && { remark }),
    updatedAt: new Date().toISOString(),
  }
  writeDB(db)
  res.json({ success: true, data: db.depositAccounts[idx] })
})

router.get('/transactions', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const { workerId, type, payMethod, startDate, endDate } = req.query
  let deposits = [...db.deposits].sort(
    (a, b) => new Date(b.operatedAt).getTime() - new Date(a.operatedAt).getTime(),
  )

  if (workerId) {
    deposits = deposits.filter((d) => d.workerId === workerId)
  }
  if (type) {
    deposits = deposits.filter((d) => d.type === type)
  }
  if (payMethod) {
    deposits = deposits.filter((d) => d.payMethod === payMethod)
  }
  if (startDate) {
    deposits = deposits.filter((d) => new Date(d.operatedAt) >= new Date(String(startDate)))
  }
  if (endDate) {
    const end = new Date(String(endDate))
    end.setDate(end.getDate() + 1)
    deposits = deposits.filter((d) => new Date(d.operatedAt) < end)
  }

  res.json({ success: true, data: deposits })
})

router.get('/transactions/:id', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const deposit = db.deposits.find((d) => d.id === req.params.id)
  if (!deposit) {
    res.status(404).json({ success: false, error: '交易记录不存在' })
    return
  }
  res.json({ success: true, data: deposit })
})

router.post('/transactions', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const {
    workerId,
    type,
    amount,
    payMethod,
    transactionNo,
    operator,
    operatedAt,
    relatedCheckInId,
    relatedCheckOutId,
    receiptId,
    remark,
  } = req.body

  if (!workerId || !type || amount === undefined || !payMethod) {
    res.status(400).json({ success: false, error: '请填写完整信息' })
    return
  }

  const accountIdx = db.depositAccounts.findIndex((a) => a.workerId === workerId)
  if (accountIdx === -1) {
    res.status(404).json({ success: false, error: '押金账户不存在' })
    return
  }

  const account = db.depositAccounts[accountIdx]
  const numAmount = Number(amount)

  if (type === 'receive') {
    account.balance += numAmount
    account.totalReceived += numAmount
  } else if (type === 'refund' || type === 'partial_refund') {
    account.balance -= numAmount
    account.totalRefunded += numAmount
  } else if (type === 'deduction') {
    account.balance -= numAmount
    account.totalDeducted += numAmount
  }

  account.lastTransactionAt = operatedAt || new Date().toISOString()
  account.updatedAt = new Date().toISOString()

  let roomId: string | undefined
  let roomNumber: string | undefined
  if (account.roomId) {
    const room = db.rooms.find((r) => r.id === account.roomId)
    if (room) {
      roomId = account.roomId
      roomNumber = room.roomNumber
    }
  }

  const now = new Date().toISOString()
  const newDeposit: Deposit = {
    id: generateId('deposit'),
    workerId,
    workerName: account.workerName,
    workerPhone: account.workerPhone,
    roomId,
    roomNumber,
    type,
    amount: numAmount,
    balance: account.balance,
    payMethod,
    transactionNo,
    operator: operator || '管理员',
    operatedAt: operatedAt || now,
    relatedCheckInId,
    relatedCheckOutId,
    receiptId,
    remark,
    createdAt: now,
    updatedAt: now,
  }

  db.deposits.push(newDeposit)
  db.depositAccounts[accountIdx] = account
  writeDB(db)
  res.json({ success: true, data: newDeposit })
})

router.put('/transactions/:id', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const idx = db.deposits.findIndex((d) => d.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: '交易记录不存在' })
    return
  }

  db.deposits[idx] = {
    ...db.deposits[idx],
    ...req.body,
    updatedAt: new Date().toISOString(),
  }
  writeDB(db)
  res.json({ success: true, data: db.deposits[idx] })
})

router.delete('/transactions/:id', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const idx = db.deposits.findIndex((d) => d.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: '交易记录不存在' })
    return
  }

  const deposit = db.deposits[idx]
  const accountIdx = db.depositAccounts.findIndex((a) => a.workerId === deposit.workerId)
  if (accountIdx !== -1) {
    const account = db.depositAccounts[accountIdx]
    if (deposit.type === 'receive') {
      account.balance -= deposit.amount
      account.totalReceived -= deposit.amount
    } else if (deposit.type === 'refund' || deposit.type === 'partial_refund') {
      account.balance += deposit.amount
      account.totalRefunded -= deposit.amount
    } else if (deposit.type === 'deduction') {
      account.balance += deposit.amount
      account.totalDeducted -= deposit.amount
    }
    account.updatedAt = new Date().toISOString()
    db.depositAccounts[accountIdx] = account
  }

  db.deposits.splice(idx, 1)
  writeDB(db)
  res.json({ success: true })
})

router.get('/stats/summary', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const accounts = db.depositAccounts

  const totalAccounts = accounts.length
  const activeAccounts = accounts.filter((a) => a.status === 'active').length
  const totalReceived = accounts.reduce((sum, a) => sum + a.totalReceived, 0)
  const totalRefunded = accounts.reduce((sum, a) => sum + a.totalRefunded, 0)
  const totalDeducted = accounts.reduce((sum, a) => sum + a.totalDeducted, 0)
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0)

  res.json({
    success: true,
    data: {
      totalAccounts,
      activeAccounts,
      totalReceived,
      totalRefunded,
      totalDeducted,
      totalBalance,
    },
  })
})

export default router
