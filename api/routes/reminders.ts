import { Router, type Request, type Response } from 'express'
import { readDB, writeDB, generateId } from '../lib/db.js'
import type { StayReminder } from '../../src/types/index.ts'

const router = Router()

function calculateDaysRemaining(expectedCheckOutDate: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expected = new Date(expectedCheckOutDate)
  expected.setHours(0, 0, 0, 0)
  const diffTime = expected.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

function getReminderType(daysRemaining: number): StayReminder['reminderType'] {
  if (daysRemaining < 0) return 'overdue'
  if (daysRemaining <= 1) return 'one_day'
  if (daysRemaining <= 3) return 'three_days'
  if (daysRemaining <= 7) return 'week'
  return 'week'
}

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const { workerId, status, reminderType } = req.query
  let reminders = [...db.stayReminders].sort((a, b) => {
    const daysA = a.daysRemaining
    const daysB = b.daysRemaining
    if (daysA < 0 && daysB >= 0) return -1
    if (daysB < 0 && daysA >= 0) return 1
    return daysA - daysB
  })
  if (workerId) {
    reminders = reminders.filter((r) => r.workerId === workerId)
  }
  if (status) {
    reminders = reminders.filter((r) => r.status === status)
  }
  if (reminderType) {
    reminders = reminders.filter((r) => r.reminderType === reminderType)
  }
  res.json({ success: true, data: reminders })
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const reminder = db.stayReminders.find((r) => r.id === req.params.id)
  if (!reminder) {
    res.status(404).json({ success: false, error: '提醒不存在' })
    return
  }
  res.json({ success: true, data: reminder })
})

router.get('/generate/auto', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const now = new Date().toISOString()

  const activeWorkers = db.workers.filter(
    (w) => w.status === 'active' && w.bedId && w.expectedCheckOutDate,
  )

  const newReminders: StayReminder[] = []
  let updatedCount = 0

  for (const worker of activeWorkers) {
    if (!worker.expectedCheckOutDate) continue

    const daysRemaining = calculateDaysRemaining(worker.expectedCheckOutDate)

    if (daysRemaining > 7) continue

    const reminderType = getReminderType(daysRemaining)

    const existingReminder = db.stayReminders.find(
      (r) => r.workerId === worker.id && r.status !== 'resolved',
    )

    const room = worker.roomId ? db.rooms.find((r) => r.id === worker.roomId) : undefined

    if (existingReminder) {
      const oldType = existingReminder.reminderType
      existingReminder.daysRemaining = daysRemaining
      existingReminder.reminderType = reminderType
      existingReminder.updatedAt = now
      if (oldType !== reminderType) {
        existingReminder.status = 'pending'
      }
      updatedCount++
    } else {
      const newReminder: StayReminder = {
        id: generateId('remind'),
        workerId: worker.id,
        workerName: worker.name,
        workerPhone: worker.phone,
        roomId: worker.roomId,
        roomNumber: room?.roomNumber,
        checkInDate: worker.checkInDate || now,
        expectedCheckOutDate: worker.expectedCheckOutDate,
        daysRemaining,
        reminderType,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      }
      db.stayReminders.push(newReminder)
      newReminders.push(newReminder)
    }
  }

  writeDB(db)
  res.json({
    success: true,
    data: {
      newCount: newReminders.length,
      updatedCount,
      totalActive: activeWorkers.length,
      reminders: [...newReminders],
    },
  })
})

router.put('/:id/notify', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const idx = db.stayReminders.findIndex((r) => r.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: '提醒不存在' })
    return
  }

  const now = new Date().toISOString()
  db.stayReminders[idx] = {
    ...db.stayReminders[idx],
    status: 'notified',
    notifiedAt: now,
    updatedAt: now,
  }
  writeDB(db)
  res.json({ success: true, data: db.stayReminders[idx] })
})

router.put('/:id/resolve', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const idx = db.stayReminders.findIndex((r) => r.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: '提醒不存在' })
    return
  }

  const now = new Date().toISOString()
  db.stayReminders[idx] = {
    ...db.stayReminders[idx],
    status: 'resolved',
    resolvedAt: now,
    remark: req.body.remark,
    updatedAt: now,
  }
  writeDB(db)
  res.json({ success: true, data: db.stayReminders[idx] })
})

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const idx = db.stayReminders.findIndex((r) => r.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: '提醒不存在' })
    return
  }

  db.stayReminders[idx] = {
    ...db.stayReminders[idx],
    ...req.body,
    updatedAt: new Date().toISOString(),
  }
  writeDB(db)
  res.json({ success: true, data: db.stayReminders[idx] })
})

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()
  const idx = db.stayReminders.findIndex((r) => r.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: '提醒不存在' })
    return
  }
  db.stayReminders.splice(idx, 1)
  writeDB(db)
  res.json({ success: true })
})

router.get('/stats/count', async (req: Request, res: Response): Promise<void> => {
  const db = readDB()

  const pendingReminders = db.stayReminders.filter((r) => r.status === 'pending')
  const overdueCount = pendingReminders.filter((r) => r.reminderType === 'overdue').length
  const oneDayCount = pendingReminders.filter((r) => r.reminderType === 'one_day').length
  const threeDaysCount = pendingReminders.filter((r) => r.reminderType === 'three_days').length
  const weekCount = pendingReminders.filter((r) => r.reminderType === 'week').length

  const activeWorkersWithExpiry = db.workers.filter(
    (w) => w.status === 'active' && w.bedId && w.expectedCheckOutDate,
  ).length

  res.json({
    success: true,
    data: {
      totalPending: pendingReminders.length,
      overdueCount,
      oneDayCount,
      threeDaysCount,
      weekCount,
      activeWorkersWithExpiry,
    },
  })
})

export default router
