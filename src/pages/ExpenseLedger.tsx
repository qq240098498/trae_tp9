import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, Button, Input, Select, Textarea, Modal, Table, Badge, StatsCard } from '../components/UI'
import { useDormitoryStore } from '../store/dormitory'
import { ExpenseLedgerTypeLabel, ExpenseLedgerStatusLabel } from '../types'
import type { ExpenseLedger } from '../types'
import { api } from '../lib/api'
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Filter,
  Download,
  DollarSign,
  Zap,
  Droplets,
  Home,
  TrendingUp,
} from 'lucide-react'

export default function ExpenseLedger() {
  const {
    expenseLedgers,
    expenseStats,
    fetchExpenseLedgers,
    addExpenseLedger,
    updateExpenseLedger,
    removeExpenseLedger,
    fetchExpenseStats,
  } = useDormitoryStore()

  const [type, setType] = useState('')
  const [status, setStatus] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedLedger, setSelectedLedger] = useState<ExpenseLedger | null>(null)
  const [formData, setFormData] = useState<Partial<ExpenseLedger>>({
    type: 'electricity',
    amount: 0,
    description: '',
    status: 'pending',
    operator: '',
    remark: '',
  })

  const fetchData = useCallback(() => {
    const params: Record<string, string | number> = {}
    if (type) params.type = type
    if (status) params.status = status
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate
    fetchExpenseLedgers(params)
    setCurrentPage(1)
  }, [type, status, startDate, endDate, fetchExpenseLedgers])

  useEffect(() => {
    fetchData()
    fetchExpenseStats()
  }, [fetchData, fetchExpenseStats])

  const filteredLedgers = useMemo(() => {
    const list = [...expenseLedgers]
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return list
  }, [expenseLedgers])

  const paginatedLedgers = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    const end = start + pageSize
    return filteredLedgers.slice(start, end)
  }, [filteredLedgers, currentPage])

  const totalPages = Math.ceil(filteredLedgers.length / pageSize)

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const formatAmount = (amount: number) => {
    return amount.toFixed(2)
  }

  const getTypeBadgeVariant = (t: ExpenseLedger['type']) => {
    switch (t) {
      case 'electricity':
        return 'warning'
      case 'water':
        return 'info'
      case 'room':
        return 'default'
      case 'other':
        return 'default'
      default:
        return 'default'
    }
  }

  const getTypeIcon = (t: ExpenseLedger['type']) => {
    switch (t) {
      case 'electricity':
        return <Zap className="h-4 w-4" />
      case 'water':
        return <Droplets className="h-4 w-4" />
      case 'room':
        return <Home className="h-4 w-4" />
      case 'other':
        return <DollarSign className="h-4 w-4" />
      default:
        return <DollarSign className="h-4 w-4" />
    }
  }

  const getStatusBadgeVariant = (s: ExpenseLedger['status']) => {
    switch (s) {
      case 'pending':
        return 'warning'
      case 'confirmed':
        return 'info'
      case 'paid':
        return 'success'
      default:
        return 'default'
    }
  }

  const handleReset = () => {
    setType('')
    setStatus('')
    setStartDate('')
    setEndDate('')
  }

  const handleSearch = () => {
    fetchData()
    fetchExpenseStats()
  }

  const handleCreate = () => {
    setFormData({
      type: 'electricity',
      amount: 0,
      description: '',
      status: 'pending',
      operator: '',
      remark: '',
    })
    setCreateModalOpen(true)
  }

  const handleEdit = (ledger: ExpenseLedger) => {
    setSelectedLedger(ledger)
    setFormData({
      type: ledger.type,
      amount: ledger.amount,
      description: ledger.description,
      status: ledger.status,
      operator: ledger.operator,
      remark: ledger.remark,
    })
    setEditModalOpen(true)
  }

  const handleDelete = (ledger: ExpenseLedger) => {
    setSelectedLedger(ledger)
    setDeleteModalOpen(true)
  }

  const validateForm = () => {
    if (!formData.type) {
      alert('请选择费用类型')
      return false
    }
    if (!formData.amount || formData.amount <= 0) {
      alert('请输入有效金额')
      return false
    }
    if (!formData.description?.trim()) {
      alert('请填写费用描述')
      return false
    }
    if (!formData.operator?.trim()) {
      alert('请填写操作人')
      return false
    }
    return true
  }

  const handleSubmitCreate = async () => {
    if (!validateForm()) return
    try {
      await addExpenseLedger(formData)
      setCreateModalOpen(false)
    } catch (e) {
      alert((e as Error).message)
    }
  }

  const handleSubmitEdit = async () => {
    if (!selectedLedger || !validateForm()) return
    try {
      await updateExpenseLedger(selectedLedger.id, formData)
      setEditModalOpen(false)
      setSelectedLedger(null)
    } catch (e) {
      alert((e as Error).message)
    }
  }

  const handleConfirmDelete = async () => {
    if (!selectedLedger) return
    try {
      await removeExpenseLedger(selectedLedger.id)
      setDeleteModalOpen(false)
      setSelectedLedger(null)
    } catch (e) {
      alert((e as Error).message)
    }
  }

  const handleExport = async () => {
    try {
      const params: Record<string, string | number> = {}
      if (type) params.type = type
      if (status) params.status = status
      if (startDate) params.startDate = startDate
      if (endDate) params.endDate = endDate

      const url = api.exportExpenseLedgers(params)
      const response = await fetch(url)
      const blob = await response.blob()

      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `费用台账_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    } catch (e) {
      alert((e as Error).message)
    }
  }

  const columns = [
    {
      key: 'createdAt',
      label: '日期',
      width: '180px',
      render: (row: ExpenseLedger) => (
        <span className="text-slate-600">{formatDate(row.createdAt)}</span>
      ),
    },
    {
      key: 'type',
      label: '类型',
      width: '100px',
      render: (row: ExpenseLedger) => (
        <Badge variant={getTypeBadgeVariant(row.type)} className="inline-flex items-center gap-1">
          {getTypeIcon(row.type)}
          {ExpenseLedgerTypeLabel[row.type]}
        </Badge>
      ),
    },
    {
      key: 'description',
      label: '描述',
      width: '200px',
      render: (row: ExpenseLedger) => (
        <span className="text-slate-700 truncate block max-w-[200px]" title={row.description}>
          {row.description}
        </span>
      ),
    },
    {
      key: 'amount',
      label: '金额(元)',
      width: '120px',
      render: (row: ExpenseLedger) => (
        <span className="font-semibold text-slate-800">¥{formatAmount(row.amount)}</span>
      ),
    },
    {
      key: 'status',
      label: '状态',
      width: '100px',
      render: (row: ExpenseLedger) => (
        <Badge variant={getStatusBadgeVariant(row.status)}>
          {ExpenseLedgerStatusLabel[row.status]}
        </Badge>
      ),
    },
    {
      key: 'operator',
      label: '操作人',
      width: '100px',
      render: (row: ExpenseLedger) => (
        <span className="text-slate-600">{row.operator || '-'}</span>
      ),
    },
    {
      key: 'actions',
      label: '操作',
      width: '160px',
      render: (row: ExpenseLedger) => (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => handleEdit(row)}>
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

  const renderPagination = () => {
    if (totalPages <= 1) return null
    return (
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
        <div className="text-sm text-slate-500">
          共 {filteredLedgers.length} 条记录，第 {currentPage}/{totalPages} 页
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            上一页
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            下一页
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <StatsCard
          title="记录总数"
          value={expenseStats?.totalCount || 0}
          icon={<BookOpen className="h-6 w-6" />}
          color="orange"
        />
        <StatsCard
          title="待确认金额"
          value={`¥${formatAmount(expenseStats?.pendingAmount || 0)}`}
          icon={<DollarSign className="h-6 w-6" />}
          color="blue"
        />
        <StatsCard
          title="已确认金额"
          value={`¥${formatAmount(expenseStats?.confirmedAmount || 0)}`}
          icon={<TrendingUp className="h-6 w-6" />}
          color="purple"
        />
        <StatsCard
          title="已收金额"
          value={`¥${formatAmount(expenseStats?.paidAmount || 0)}`}
          icon={<DollarSign className="h-6 w-6" />}
          color="green"
        />
      </div>

      <Card>
        <div className="flex flex-wrap gap-4 items-end">
          <Select
            label="费用类型"
            value={type}
            onChange={(e) => setType(e.target.value)}
            options={[
              { value: '', label: '全部类型' },
              { value: 'electricity', label: '电费' },
              { value: 'water', label: '水费' },
              { value: 'room', label: '房费' },
              { value: 'other', label: '其他' },
            ]}
            className="w-36"
          />
          <Select
            label="状态"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: '', label: '全部状态' },
              { value: 'pending', label: '待确认' },
              { value: 'confirmed', label: '已确认' },
              { value: 'paid', label: '已缴费' },
            ]}
            className="w-36"
          />
          <Input
            label="开始日期"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-40"
          />
          <Input
            label="结束日期"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-40"
          />
          <div className="flex gap-2">
            <Button onClick={handleSearch}>
              <Filter className="h-4 w-4" />
              查询
            </Button>
            <Button variant="secondary" onClick={handleReset}>
              重置
            </Button>
          </div>
        </div>
      </Card>

      <Card
        title={`费用台账 (共 ${filteredLedgers.length} 条)`}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleExport}>
              <Download className="h-4 w-4" />
              导出CSV
            </Button>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4" />
              新增记录
            </Button>
          </div>
        }
      >
        <Table
          columns={columns}
          data={paginatedLedgers}
          emptyText="暂无费用台账记录"
        />
        {renderPagination()}
      </Card>

      <Modal
        open={createModalOpen}
        title="新增费用台账"
        onClose={() => setCreateModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmitCreate}>提交</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="费用类型"
              value={formData.type || 'electricity'}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as ExpenseLedger['type'],
                })
              }
              options={[
                { value: 'electricity', label: '电费' },
                { value: 'water', label: '水费' },
                { value: 'room', label: '房费' },
                { value: 'other', label: '其他' },
              ]}
            />
            <Select
              label="状态"
              value={formData.status || 'pending'}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as ExpenseLedger['status'],
                })
              }
              options={[
                { value: 'pending', label: '待确认' },
                { value: 'confirmed', label: '已确认' },
                { value: 'paid', label: '已缴费' },
              ]}
            />
          </div>
          <Input
            label="金额(元)"
            type="number"
            step="0.01"
            min="0"
            value={formData.amount || ''}
            onChange={(e) =>
              setFormData({ ...formData, amount: Number(e.target.value) || 0 })
            }
            placeholder="请输入金额"
          />
          <Input
            label="费用描述"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="请输入费用描述"
          />
          <Input
            label="操作人"
            value={formData.operator || ''}
            onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
            placeholder="请输入操作人姓名"
          />
          <Textarea
            label="备注"
            value={formData.remark || ''}
            onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
            placeholder="请输入备注信息（可选）"
            rows={3}
          />
        </div>
      </Modal>

      <Modal
        open={editModalOpen}
        title="编辑费用台账"
        onClose={() => {
          setEditModalOpen(false)
          setSelectedLedger(null)
        }}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setEditModalOpen(false)
                setSelectedLedger(null)
              }}
            >
              取消
            </Button>
            <Button onClick={handleSubmitEdit}>保存</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="费用类型"
              value={formData.type || 'electricity'}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as ExpenseLedger['type'],
                })
              }
              options={[
                { value: 'electricity', label: '电费' },
                { value: 'water', label: '水费' },
                { value: 'room', label: '房费' },
                { value: 'other', label: '其他' },
              ]}
            />
            <Select
              label="状态"
              value={formData.status || 'pending'}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as ExpenseLedger['status'],
                })
              }
              options={[
                { value: 'pending', label: '待确认' },
                { value: 'confirmed', label: '已确认' },
                { value: 'paid', label: '已缴费' },
              ]}
            />
          </div>
          <Input
            label="金额(元)"
            type="number"
            step="0.01"
            min="0"
            value={formData.amount || ''}
            onChange={(e) =>
              setFormData({ ...formData, amount: Number(e.target.value) || 0 })
            }
            placeholder="请输入金额"
          />
          <Input
            label="费用描述"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="请输入费用描述"
          />
          <Input
            label="操作人"
            value={formData.operator || ''}
            onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
            placeholder="请输入操作人姓名"
          />
          <Textarea
            label="备注"
            value={formData.remark || ''}
            onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
            placeholder="请输入备注信息（可选）"
            rows={3}
          />
        </div>
      </Modal>

      <Modal
        open={deleteModalOpen}
        title="确认删除"
        onClose={() => {
          setDeleteModalOpen(false)
          setSelectedLedger(null)
        }}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setDeleteModalOpen(false)
                setSelectedLedger(null)
              }}
            >
              取消
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete}>
              确认删除
            </Button>
          </>
        }
      >
        <p className="text-slate-600">
          确定要删除这条费用台账记录吗？此操作不可撤销。
        </p>
        {selectedLedger && (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg">
            <p className="text-sm">
              <span className="text-slate-500">类型：</span>
              <span className="text-slate-700">
                {ExpenseLedgerTypeLabel[selectedLedger.type]}
              </span>
            </p>
            <p className="text-sm mt-2">
              <span className="text-slate-500">描述：</span>
              <span className="text-slate-700">{selectedLedger.description}</span>
            </p>
            <p className="text-sm mt-2">
              <span className="text-slate-500">金额：</span>
              <span className="text-slate-700 font-semibold">
                ¥{formatAmount(selectedLedger.amount)}
              </span>
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}
