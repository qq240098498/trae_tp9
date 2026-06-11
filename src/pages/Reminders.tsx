import { useEffect, useMemo, useState } from 'react'
import { Card, Input, Select, Button, Badge, Table, Modal, StatsCard, Textarea } from '../components/UI'
import { useDormitoryStore } from '../store/dormitory'
import { ReminderTypeLabel, ReminderStatusLabel } from '../types'
import type { StayReminder } from '../types'
import {
  Bell,
  RefreshCw,
  CheckCircle,
  CheckSquare,
  Edit2,
  Trash2,
  Filter,
  AlertTriangle,
  Clock,
  Calendar,
} from 'lucide-react'

export default function Reminders() {
  const {
    stayReminders,
    reminderStats,
    loading,
    fetchReminders,
    generateReminders,
    notifyReminder,
    resolveReminder,
    updateReminder,
    removeReminder,
    fetchReminderStats,
  } = useDormitoryStore()

  const [reminderType, setReminderType] = useState('')
  const [status, setStatus] = useState('')
  const [keyword, setKeyword] = useState('')

  const [resolveModalOpen, setResolveModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedReminder, setSelectedReminder] = useState<StayReminder | null>(null)
  const [resolveData, setResolveData] = useState({ resolution: '', remark: '' })
  const [editData, setEditData] = useState<Partial<StayReminder>>({})

  useEffect(() => {
    fetchReminders()
    fetchReminderStats()
  }, [fetchReminders, fetchReminderStats])

  const sortedReminders = useMemo(() => {
    return [...stayReminders].sort((a, b) => a.daysRemaining - b.daysRemaining)
  }, [stayReminders])

  const filteredReminders = useMemo(() => {
    let list = [...sortedReminders]
    if (reminderType) {
      list = list.filter((r) => r.reminderType === reminderType)
    }
    if (status) {
      list = list.filter((r) => r.status === status)
    }
    if (keyword.trim()) {
      const kw = keyword.trim().toLowerCase()
      list = list.filter(
        (r) =>
          r.workerName.toLowerCase().includes(kw) ||
          r.workerPhone.includes(kw),
      )
    }
    return list
  }, [sortedReminders, reminderType, status, keyword])

  const handleSearch = () => {
    fetchReminders()
  }

  const handleReset = () => {
    setReminderType('')
    setStatus('')
    setKeyword('')
  }

  const handleGenerate = async () => {
    try {
      await generateReminders()
      alert('提醒生成成功')
    } catch (e) {
      alert((e as Error).message)
    }
  }

  const handleNotify = async (reminder: StayReminder) => {
    try {
      await notifyReminder(reminder.id)
    } catch (e) {
      alert((e as Error).message)
    }
  }

  const handleResolveClick = (reminder: StayReminder) => {
    setSelectedReminder(reminder)
    setResolveData({ resolution: '', remark: '' })
    setResolveModalOpen(true)
  }

  const handleResolve = async () => {
    if (!selectedReminder) return
    if (!resolveData.resolution) {
      alert('请选择处理方式')
      return
    }
    try {
      await resolveReminder(selectedReminder.id, {
        remark: resolveData.remark || undefined,
      })
      setResolveModalOpen(false)
      setSelectedReminder(null)
    } catch (e) {
      alert((e as Error).message)
    }
  }

  const handleEditClick = (reminder: StayReminder) => {
    setSelectedReminder(reminder)
    setEditData({
      workerName: reminder.workerName,
      workerPhone: reminder.workerPhone,
      expectedCheckOutDate: reminder.expectedCheckOutDate,
      remark: reminder.remark,
    })
    setEditModalOpen(true)
  }

  const handleEdit = async () => {
    if (!selectedReminder) return
    try {
      await updateReminder(selectedReminder.id, editData)
      setEditModalOpen(false)
      setSelectedReminder(null)
    } catch (e) {
      alert((e as Error).message)
    }
  }

  const handleDelete = async (reminder: StayReminder) => {
    if (!confirm(`确定要删除 ${reminder.workerName} 的提醒吗？`)) return
    try {
      await removeReminder(reminder.id)
    } catch (e) {
      alert((e as Error).message)
    }
  }

  const getDaysRemainingColor = (days: number) => {
    if (days > 0) return 'text-green-600'
    if (days === 0) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getDaysRemainingText = (days: number) => {
    if (days > 0) return `${days}天`
    if (days === 0) return '今天到期'
    return `逾期${Math.abs(days)}天`
  }

  const getReminderTypeBadge = (type: StayReminder['reminderType']) => {
    const variants: Record<string, 'info' | 'warning' | 'danger'> = {
      week: 'info',
      three_days: 'warning',
      one_day: 'danger',
      overdue: 'danger',
    }
    return <Badge variant={variants[type]}>{ReminderTypeLabel[type]}</Badge>
  }

  const getStatusBadge = (s: StayReminder['status']) => {
    const variants: Record<string, 'warning' | 'info' | 'success'> = {
      pending: 'warning',
      notified: 'info',
      resolved: 'success',
    }
    return <Badge variant={variants[s]}>{ReminderStatusLabel[s]}</Badge>
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  }

  const columns = [
    {
      key: 'workerName',
      label: '工人姓名',
      width: '100px',
    },
    {
      key: 'workerPhone',
      label: '联系电话',
      width: '120px',
    },
    {
      key: 'expectedCheckOutDate',
      label: '预计退宿日期',
      width: '120px',
      render: (row: StayReminder) => (
        <span className="text-slate-600">{formatDate(row.expectedCheckOutDate)}</span>
      ),
    },
    {
      key: 'daysRemaining',
      label: '剩余天数',
      width: '100px',
      render: (row: StayReminder) => (
        <span className={`font-medium ${getDaysRemainingColor(row.daysRemaining)}`}>
          {getDaysRemainingText(row.daysRemaining)}
        </span>
      ),
    },
    {
      key: 'reminderType',
      label: '提醒类型',
      width: '100px',
      render: (row: StayReminder) => getReminderTypeBadge(row.reminderType),
    },
    {
      key: 'status',
      label: '状态',
      width: '80px',
      render: (row: StayReminder) => getStatusBadge(row.status),
    },
    {
      key: 'actions',
      label: '操作',
      width: '240px',
      render: (row: StayReminder) => (
        <div className="flex gap-1 flex-wrap">
          {row.status === 'pending' && (
            <Button size="sm" variant="ghost" onClick={() => handleNotify(row)}>
              <CheckCircle className="h-4 w-4" />
              标记已通知
            </Button>
          )}
          {row.status === 'notified' && (
            <Button size="sm" variant="ghost" onClick={() => handleResolveClick(row)}>
              <CheckSquare className="h-4 w-4" />
              标记已处理
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => handleEditClick(row)}>
            <Edit2 className="h-4 w-4" />
            编辑
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-red-500"
            onClick={() => handleDelete(row)}
          >
            <Trash2 className="h-4 w-4" />
            删除
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <StatsCard
          title="待处理提醒"
          value={reminderStats?.pending || 0}
          icon={<Bell className="h-6 w-6" />}
          color="orange"
        />
        <StatsCard
          title="已逾期"
          value={reminderStats?.overdue || 0}
          icon={<AlertTriangle className="h-6 w-6" />}
          color="blue"
        />
        <StatsCard
          title="三天内到期"
          value={reminderStats?.threeDays || 0}
          icon={<Clock className="h-6 w-6" />}
          color="purple"
        />
        <StatsCard
          title="一周内到期"
          value={reminderStats?.week || 0}
          icon={<Calendar className="h-6 w-6" />}
          color="green"
        />
      </div>

      <Card>
        <div className="flex flex-wrap gap-4 items-end">
          <Select
            label="提醒类型"
            value={reminderType}
            onChange={(e) => setReminderType(e.target.value)}
            options={[
              { value: '', label: '全部类型' },
              { value: 'week', label: '一周内到期' },
              { value: 'three_days', label: '三天内到期' },
              { value: 'one_day', label: '一天内到期' },
              { value: 'overdue', label: '已逾期' },
            ]}
            className="w-36"
          />
          <Select
            label="状态"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: '', label: '全部状态' },
              { value: 'pending', label: '待通知' },
              { value: 'notified', label: '已通知' },
              { value: 'resolved', label: '已处理' },
            ]}
            className="w-36"
          />
          <Input
            label="关键词"
            placeholder="姓名/电话"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-48"
          />
          <div className="flex gap-2">
            <Button onClick={handleSearch}>
              <Filter className="h-4 w-4" />
              筛选
            </Button>
            <Button variant="secondary" onClick={handleReset}>
              <RefreshCw className="h-4 w-4" />
              重置
            </Button>
          </div>
        </div>
      </Card>

      <Card
        title={`住宿到期提醒 (共 ${filteredReminders.length} 条)`}
        actions={
          <Button onClick={handleGenerate} disabled={loading}>
            <RefreshCw className="h-4 w-4" />
            一键扫描生成
          </Button>
        }
      >
        <Table columns={columns} data={filteredReminders} emptyText="暂无提醒" />
      </Card>

      <Modal
        open={resolveModalOpen}
        title="标记已处理"
        onClose={() => setResolveModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setResolveModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleResolve}>确认</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="处理方式"
            value={resolveData.resolution}
            onChange={(e) => setResolveData({ ...resolveData, resolution: e.target.value })}
            options={[
              { value: '', label: '请选择处理方式' },
              { value: 'checked_out', label: '已退宿' },
              { value: 'extended', label: '已续住' },
            ]}
          />
          <Textarea
            label="备注"
            placeholder="请输入备注信息"
            value={resolveData.remark}
            onChange={(e) => setResolveData({ ...resolveData, remark: e.target.value })}
            rows={3}
          />
        </div>
      </Modal>

      <Modal
        open={editModalOpen}
        title="编辑提醒"
        onClose={() => setEditModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleEdit}>保存</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="工人姓名"
            value={editData.workerName || ''}
            onChange={(e) => setEditData({ ...editData, workerName: e.target.value })}
          />
          <Input
            label="联系电话"
            value={editData.workerPhone || ''}
            onChange={(e) => setEditData({ ...editData, workerPhone: e.target.value })}
          />
          <Input
            label="预计退宿日期"
            type="date"
            value={editData.expectedCheckOutDate || ''}
            onChange={(e) => setEditData({ ...editData, expectedCheckOutDate: e.target.value })}
          />
          <Textarea
            label="备注"
            placeholder="请输入备注信息"
            value={editData.remark || ''}
            onChange={(e) => setEditData({ ...editData, remark: e.target.value })}
            rows={3}
          />
        </div>
      </Modal>
    </div>
  )
}
