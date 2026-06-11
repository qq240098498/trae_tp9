import { useEffect, useMemo, useState } from 'react'
import { Card, Input, Select, Button, Badge, Table, Modal, StatsCard, Textarea } from '../components/UI'
import { useDormitoryStore } from '../store/dormitory'
import { UtilityBillStatusLabel } from '../types'
import type { UtilityBill, Building, Room } from '../types'
import {
  FileText,
  Plus,
  Check,
  CreditCard,
  Edit2,
  Trash2,
  Download,
  Layers,
  TrendingUp,
  AlertCircle,
  RotateCcw,
  Search,
} from 'lucide-react'

export default function Bills() {
  const {
    utilityBills,
    billsStats,
    utilityReadings,
    buildings,
    rooms,
    fetchBills,
    generateBill,
    batchGenerateBills,
    confirmBill,
    payBill,
    updateBill,
    removeBill,
    fetchBillsStats,
    fetchUtilityReadings,
    fetchBuildings,
    fetchRooms,
  } = useDormitoryStore()

  const [buildingId, setBuildingId] = useState('')
  const [roomId, setRoomId] = useState('')
  const [status, setStatus] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  const [generateModalOpen, setGenerateModalOpen] = useState(false)
  const [batchModalOpen, setBatchModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedBill, setSelectedBill] = useState<UtilityBill | null>(null)
  const [formData, setFormData] = useState<Partial<UtilityBill>>({})
  const [batchForm, setBatchForm] = useState({ billingPeriod: '', buildingId: '' })
  const [generateForm, setGenerateForm] = useState({ readingId: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchBills()
    fetchBillsStats()
    fetchUtilityReadings()
    fetchBuildings()
  }, [fetchBills, fetchBillsStats, fetchUtilityReadings, fetchBuildings])

  useEffect(() => {
    if (buildingId) {
      fetchRooms({ buildingId })
    } else {
      setRoomId('')
    }
  }, [buildingId, fetchRooms])

  const filteredBills = useMemo(() => {
    let list = [...utilityBills]

    if (buildingId) {
      list = list.filter((b) => b.buildingId === buildingId)
    }
    if (roomId) {
      list = list.filter((b) => b.roomId === roomId)
    }
    if (status) {
      list = list.filter((b) => b.status === status)
    }
    if (startDate) {
      list = list.filter((b) => b.billingPeriod >= startDate)
    }
    if (endDate) {
      list = list.filter((b) => b.billingPeriod <= endDate)
    }

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return list
  }, [utilityBills, buildingId, roomId, status, startDate, endDate])

  const paginatedBills = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredBills.slice(start, start + pageSize)
  }, [filteredBills, currentPage])

  const totalPages = Math.ceil(filteredBills.length / pageSize)

  const availableReadings = useMemo(() => {
    const existingReadingIds = utilityBills.map((b) => b.readingId)
    return utilityReadings.filter((r) => !existingReadingIds.includes(r.id))
  }, [utilityReadings, utilityBills])

  const handleReset = () => {
    setBuildingId('')
    setRoomId('')
    setStatus('')
    setStartDate('')
    setEndDate('')
    setCurrentPage(1)
  }

  const handleSearch = () => {
    setCurrentPage(1)
  }

  const getStatusBadge = (s: UtilityBill['status']) => {
    switch (s) {
      case 'pending':
        return <Badge variant="warning">{UtilityBillStatusLabel[s]}</Badge>
      case 'confirmed':
        return <Badge variant="info">{UtilityBillStatusLabel[s]}</Badge>
      case 'paid':
        return <Badge variant="success">{UtilityBillStatusLabel[s]}</Badge>
      default:
        return <Badge>{s}</Badge>
    }
  }

  const handleGenerate = () => {
    setGenerateForm({ readingId: '' })
    setGenerateModalOpen(true)
  }

  const handleGenerateSubmit = async () => {
    if (!generateForm.readingId) {
      alert('请选择抄表记录')
      return
    }
    setSubmitting(true)
    try {
      await generateBill({ readingId: generateForm.readingId })
      setGenerateModalOpen(false)
      fetchBillsStats()
    } catch (e) {
      alert(e instanceof Error ? e.message : '操作失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleBatchGenerate = () => {
    const now = new Date()
    const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    setBatchForm({ billingPeriod: defaultPeriod, buildingId: '' })
    setBatchModalOpen(true)
  }

  const handleBatchSubmit = async () => {
    if (!batchForm.billingPeriod) {
      alert('请选择账期月份')
      return
    }
    setSubmitting(true)
    try {
      let readingsToGenerate = [...availableReadings]

      if (batchForm.buildingId) {
        readingsToGenerate = readingsToGenerate.filter(
          (r) => r.buildingId === batchForm.buildingId
        )
      }

      const [year, month] = batchForm.billingPeriod.split('-')
      readingsToGenerate = readingsToGenerate.filter((r) => {
        const readingDate = new Date(r.readingDate)
        return (
          readingDate.getFullYear() === parseInt(year) &&
          readingDate.getMonth() === parseInt(month) - 1
        )
      })

      if (readingsToGenerate.length === 0) {
        alert('没有符合条件的抄表记录可生成账单')
        setSubmitting(false)
        return
      }

      if (!confirm(`确定要为 ${readingsToGenerate.length} 条抄表记录生成账单吗？`)) {
        setSubmitting(false)
        return
      }

      await batchGenerateBills({ readingIds: readingsToGenerate.map((r) => r.id) })
      setBatchModalOpen(false)
      fetchBillsStats()
    } catch (e) {
      alert(e instanceof Error ? e.message : '操作失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleConfirm = async (bill: UtilityBill) => {
    if (!confirm(`确定要确认账单 "${bill.billingPeriod} ${bill.roomNumber}" 吗？`)) return
    try {
      await confirmBill(bill.id)
    } catch (e) {
      alert(e instanceof Error ? e.message : '操作失败')
    }
  }

  const handlePay = async (bill: UtilityBill) => {
    if (!confirm(`确定要标记账单 "${bill.billingPeriod} ${bill.roomNumber}" 为已缴费吗？`)) return
    try {
      await payBill(bill.id)
    } catch (e) {
      alert(e instanceof Error ? e.message : '操作失败')
    }
  }

  const handleEdit = (bill: UtilityBill) => {
    setSelectedBill(bill)
    setFormData({
      electricityUsage: bill.electricityUsage,
      waterUsage: bill.waterUsage,
      electricityCost: bill.electricityCost,
      waterCost: bill.waterCost,
      totalCost: bill.totalCost,
      remark: bill.remark,
    })
    setEditModalOpen(true)
  }

  const handleEditSubmit = async () => {
    if (!selectedBill) return
    if (formData.electricityUsage === undefined || formData.electricityUsage < 0) {
      alert('请输入有效的用电量')
      return
    }
    if (formData.waterUsage === undefined || formData.waterUsage < 0) {
      alert('请输入有效的用水量')
      return
    }
    if (formData.electricityCost === undefined || formData.electricityCost < 0) {
      alert('请输入有效的电费')
      return
    }
    if (formData.waterCost === undefined || formData.waterCost < 0) {
      alert('请输入有效的水费')
      return
    }
    setSubmitting(true)
    try {
      await updateBill(selectedBill.id, {
        ...formData,
        totalCost: (formData.electricityCost || 0) + (formData.waterCost || 0),
      })
      setEditModalOpen(false)
      fetchBillsStats()
    } catch (e) {
      alert(e instanceof Error ? e.message : '操作失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (bill: UtilityBill) => {
    if (!confirm(`确定要删除账单 "${bill.billingPeriod} ${bill.roomNumber}" 吗？`)) return
    try {
      await removeBill(bill.id)
      fetchBillsStats()
    } catch (e) {
      alert(e instanceof Error ? e.message : '操作失败')
    }
  }

  const handleExport = () => {
    const headers = [
      '账期',
      '楼栋',
      '房间',
      '用电量(度)',
      '电费(元)',
      '用水量(吨)',
      '水费(元)',
      '总金额(元)',
      '状态',
      '创建时间',
    ]
    const rows = filteredBills.map((b) => [
      b.billingPeriod,
      b.buildingName,
      b.roomNumber,
      b.electricityUsage,
      b.electricityCost.toFixed(2),
      b.waterUsage,
      b.waterCost.toFixed(2),
      b.totalCost.toFixed(2),
      UtilityBillStatusLabel[b.status],
      b.createdAt,
    ])
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `费用账单_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const formatNumber = (n?: number) => {
    if (n === undefined || n === null) return '0.00'
    return n.toFixed(2)
  }

  const columns = [
    {
      key: 'billingPeriod',
      label: '账期',
      width: '100px',
    },
    {
      key: 'buildingName',
      label: '楼栋',
      width: '100px',
      render: (row: UtilityBill) => <span className="text-slate-600">{row.buildingName}</span>,
    },
    {
      key: 'roomNumber',
      label: '房间',
      width: '80px',
      render: (row: UtilityBill) => <span className="text-slate-600">{row.roomNumber}</span>,
    },
    {
      key: 'electricityUsage',
      label: '用电量(度)',
      width: '100px',
      render: (row: UtilityBill) => (
        <span className="text-slate-600">{row.electricityUsage}</span>
      ),
    },
    {
      key: 'electricityCost',
      label: '电费(元)',
      width: '100px',
      render: (row: UtilityBill) => (
        <span className="text-slate-600">¥{formatNumber(row.electricityCost)}</span>
      ),
    },
    {
      key: 'waterUsage',
      label: '用水量(吨)',
      width: '100px',
      render: (row: UtilityBill) => <span className="text-slate-600">{row.waterUsage}</span>,
    },
    {
      key: 'waterCost',
      label: '水费(元)',
      width: '100px',
      render: (row: UtilityBill) => (
        <span className="text-slate-600">¥{formatNumber(row.waterCost)}</span>
      ),
    },
    {
      key: 'totalCost',
      label: '总金额(元)',
      width: '110px',
      render: (row: UtilityBill) => (
        <span className="font-semibold text-orange-600">¥{formatNumber(row.totalCost)}</span>
      ),
    },
    {
      key: 'status',
      label: '状态',
      width: '90px',
      render: (row: UtilityBill) => getStatusBadge(row.status),
    },
    {
      key: 'actions',
      label: '操作',
      width: '240px',
      render: (row: UtilityBill) => (
        <div className="flex gap-2">
          {row.status === 'pending' && (
            <Button size="sm" variant="ghost" onClick={() => handleConfirm(row)}>
              <Check className="h-4 w-4" />
              确认
            </Button>
          )}
          {row.status === 'confirmed' && (
            <Button size="sm" variant="ghost" onClick={() => handlePay(row)}>
              <CreditCard className="h-4 w-4" />
              缴费
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => handleEdit(row)}>
            <Edit2 className="h-4 w-4" />
            编辑
          </Button>
          <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDelete(row)}>
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
          title="账单总数"
          value={billsStats?.total || 0}
          icon={<FileText className="h-6 w-6" />}
          color="orange"
        />
        <StatsCard
          title="待确认金额"
          value={`¥${formatNumber(billsStats?.pendingAmount)}`}
          icon={<AlertCircle className="h-6 w-6" />}
          color="blue"
        />
        <StatsCard
          title="已确认金额"
          value={`¥${formatNumber(billsStats?.confirmedAmount)}`}
          icon={<Layers className="h-6 w-6" />}
          color="purple"
        />
        <StatsCard
          title="已收金额"
          value={`¥${formatNumber(billsStats?.paidAmount)}`}
          icon={<TrendingUp className="h-6 w-6" />}
          color="green"
        />
      </div>

      <Card>
        <div className="flex flex-wrap gap-4 items-end">
          <Select
            label="楼栋"
            value={buildingId}
            onChange={(e) => setBuildingId(e.target.value)}
            options={[
              { value: '', label: '全部楼栋' },
              ...(buildings as Building[]).map((b) => ({ value: b.id, label: b.name })),
            ]}
            className="w-40"
          />
          <Select
            label="房间"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            options={[
              { value: '', label: '全部房间' },
              ...(rooms as Room[]).map((r) => ({ value: r.id, label: r.roomNumber })),
            ]}
            className="w-40"
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
            type="month"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-44"
          />
          <Input
            label="结束日期"
            type="month"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-44"
          />
          <div className="flex gap-2">
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4" />
              查询
            </Button>
            <Button variant="secondary" onClick={handleReset}>
              <RotateCcw className="h-4 w-4" />
              重置
            </Button>
          </div>
        </div>
      </Card>

      <Card
        title={`费用账单 (共 ${filteredBills.length} 条)`}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleExport}>
              <Download className="h-4 w-4" />
              导出
            </Button>
            <Button variant="secondary" onClick={handleBatchGenerate}>
              <Layers className="h-4 w-4" />
              批量生成
            </Button>
            <Button onClick={handleGenerate}>
              <Plus className="h-4 w-4" />
              生成账单
            </Button>
          </div>
        }
      >
        <Table columns={columns} data={paginatedBills} emptyText="暂无费用账单" />
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
            <span className="text-sm text-slate-500">
              共 {filteredBills.length} 条记录，第 {currentPage}/{totalPages} 页
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                上一页
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((p, idx, arr) => (
                  <div key={p} className="flex items-center">
                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                      <span className="px-2 text-slate-400">...</span>
                    )}
                    <Button
                      size="sm"
                      variant={currentPage === p ? 'primary' : 'secondary'}
                      onClick={() => setCurrentPage(p)}
                    >
                      {p}
                    </Button>
                  </div>
                ))}
              <Button
                size="sm"
                variant="secondary"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                下一页
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Modal
        open={generateModalOpen}
        title="生成账单"
        onClose={() => setGenerateModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setGenerateModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleGenerateSubmit} disabled={submitting}>
              {submitting ? '生成中...' : '生成'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="选择抄表记录"
            value={generateForm.readingId}
            onChange={(e) => setGenerateForm({ ...generateForm, readingId: e.target.value })}
            options={[
              { value: '', label: '请选择抄表记录' },
              ...availableReadings.map((r) => ({
                value: r.id,
                label: `${r.readingDate} ${r.buildingName} ${r.roomNumber} - 电${r.electricityUsage}度 水${r.waterUsage}吨`,
              })),
            ]}
          />
          {availableReadings.length === 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
              所有抄表记录已生成账单，暂无可用记录
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={batchModalOpen}
        title="批量生成账单"
        onClose={() => setBatchModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setBatchModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleBatchSubmit} disabled={submitting}>
              {submitting ? '生成中...' : '批量生成'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="账期月份"
            type="month"
            value={batchForm.billingPeriod}
            onChange={(e) => setBatchForm({ ...batchForm, billingPeriod: e.target.value })}
          />
          <Select
            label="楼栋（可选）"
            value={batchForm.buildingId}
            onChange={(e) => setBatchForm({ ...batchForm, buildingId: e.target.value })}
            options={[
              { value: '', label: '全部楼栋' },
              ...(buildings as Building[]).map((b) => ({ value: b.id, label: b.name })),
            ]}
          />
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
            将为所选月份和楼栋内尚未生成账单的抄表记录批量生成账单
          </div>
        </div>
      </Modal>

      <Modal
        open={editModalOpen}
        title="编辑账单"
        onClose={() => setEditModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleEditSubmit} disabled={submitting}>
              {submitting ? '保存中...' : '保存'}
            </Button>
          </>
        }
      >
        {selectedBill && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">楼栋</label>
                <p className="text-slate-600">{selectedBill.buildingName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">房间</label>
                <p className="text-slate-600">{selectedBill.roomNumber}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">账期</label>
                <p className="text-slate-600">{selectedBill.billingPeriod}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">状态</label>
                {getStatusBadge(selectedBill.status)}
              </div>
            </div>
            <div className="border-t border-slate-200 pt-4 grid grid-cols-2 gap-4">
              <Input
                label="用电量(度)"
                type="number"
                step="0.01"
                min="0"
                value={formData.electricityUsage ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    electricityUsage: Number(e.target.value) || 0,
                  })
                }
              />
              <Input
                label="电费(元)"
                type="number"
                step="0.01"
                min="0"
                value={formData.electricityCost ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    electricityCost: Number(e.target.value) || 0,
                  })
                }
              />
              <Input
                label="用水量(吨)"
                type="number"
                step="0.01"
                min="0"
                value={formData.waterUsage ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    waterUsage: Number(e.target.value) || 0,
                  })
                }
              />
              <Input
                label="水费(元)"
                type="number"
                step="0.01"
                min="0"
                value={formData.waterCost ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    waterCost: Number(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-700">
                总金额：¥
                {formatNumber(
                  (formData.electricityCost || 0) + (formData.waterCost || 0)
                )}
              </p>
            </div>
            <Textarea
              label="备注"
              value={formData.remark || ''}
              onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
              placeholder="请输入备注信息（选填）"
              rows={3}
            />
          </div>
        )}
      </Modal>
    </div>
  )
}
