import { useEffect, useMemo, useState } from 'react'
import { Card, Input, Select, Button, Badge, Table, Modal, StatsCard, Textarea } from '../components/UI'
import { useDormitoryStore } from '../store/dormitory'
import { FeeSupplementTypeLabel, FeeSupplementStatusLabel, ReceiptTypeLabel, PayMethodLabel, PayerTypeLabel } from '../types'
import type { FeeSupplement, Receipt } from '../types'
import {
  Receipt as ReceiptIcon,
  Plus,
  DollarSign,
  FileText,
  CheckCircle,
  Printer,
  Trash2,
  Filter,
  RefreshCw,
  Eye,
} from 'lucide-react'

type TabKey = 'supplement' | 'receipt'

export default function FeeSupplement() {
  const {
    feeSupplements,
    feeSupplementStats,
    receipts,
    loading,
    workers,
    rooms,
    fetchFeeSupplements,
    fetchFeeSupplementStats,
    fetchReceipts,
    createFeeSupplement,
    confirmFeeSupplement,
    payFeeSupplement,
    removeFeeSupplement,
    createReceipt,
    printReceipt,
    removeReceipt,
  } = useDormitoryStore()

  const [activeTab, setActiveTab] = useState<TabKey>('supplement')

  const [supplementType, setSupplementType] = useState('')
  const [supplementStatus, setSupplementStatus] = useState('')
  const [supplementKeyword, setSupplementKeyword] = useState('')

  const [receiptType, setReceiptType] = useState('')
  const [receiptPayerType, setReceiptPayerType] = useState('')
  const [receiptDateFrom, setReceiptDateFrom] = useState('')
  const [receiptDateTo, setReceiptDateTo] = useState('')

  const [addSupplementModalOpen, setAddSupplementModalOpen] = useState(false)
  const [paySupplementModalOpen, setPaySupplementModalOpen] = useState(false)
  const [addReceiptModalOpen, setAddReceiptModalOpen] = useState(false)

  const [selectedSupplement, setSelectedSupplement] = useState<FeeSupplement | null>(null)
  const [newSupplementData, setNewSupplementData] = useState({
    workerId: '',
    roomId: '',
    type: 'electricity' as FeeSupplement['type'],
    amount: '',
    reason: '',
    operator: '',
  })
  const [payData, setPayData] = useState({
    payMethod: 'cash' as FeeSupplement['payMethod'],
    transactionNo: '',
    operator: '',
  })
  const [newReceiptData, setNewReceiptData] = useState({
    type: 'deposit' as Receipt['type'],
    payerName: '',
    payerType: 'worker' as Receipt['payerType'],
    amount: '',
    payMethod: 'cash' as Receipt['payMethod'],
    transactionNo: '',
    operator: '',
    items: [] as Array<{ name: string; description: string; amount: string }>,
  })

  useEffect(() => {
    fetchFeeSupplements()
    fetchFeeSupplementStats()
    fetchReceipts()
  }, [fetchFeeSupplements, fetchFeeSupplementStats, fetchReceipts])

  const filteredFeeSupplements = useMemo(() => {
    let list = [...feeSupplements]
    if (supplementType) {
      list = list.filter((s) => s.type === supplementType)
    }
    if (supplementStatus) {
      list = list.filter((s) => s.status === supplementStatus)
    }
    if (supplementKeyword.trim()) {
      const kw = supplementKeyword.trim().toLowerCase()
      list = list.filter(
        (s) =>
          (s.workerName && s.workerName.toLowerCase().includes(kw)) ||
          (s.roomNumber && s.roomNumber.toLowerCase().includes(kw)) ||
          (s.reason && s.reason.toLowerCase().includes(kw)),
      )
    }
    return list
  }, [feeSupplements, supplementType, supplementStatus, supplementKeyword])

  const filteredReceipts = useMemo(() => {
    let list = [...receipts]
    if (receiptType) {
      list = list.filter((r) => r.type === receiptType)
    }
    if (receiptPayerType) {
      list = list.filter((r) => r.payerType === receiptPayerType)
    }
    if (receiptDateFrom) {
      list = list.filter((r) => r.issuedAt >= receiptDateFrom)
    }
    if (receiptDateTo) {
      list = list.filter((r) => r.issuedAt <= receiptDateTo + 'T23:59:59')
    }
    return list
  }, [receipts, receiptType, receiptPayerType, receiptDateFrom, receiptDateTo])

  const handleSupplementSearch = () => {
    fetchFeeSupplements()
  }

  const handleSupplementReset = () => {
    setSupplementType('')
    setSupplementStatus('')
    setSupplementKeyword('')
  }

  const handleReceiptSearch = () => {
    fetchReceipts()
  }

  const handleReceiptReset = () => {
    setReceiptType('')
    setReceiptPayerType('')
    setReceiptDateFrom('')
    setReceiptDateTo('')
  }

  const handleAddSupplement = () => {
    setNewSupplementData({
      workerId: '',
      roomId: '',
      type: 'electricity',
      amount: '',
      reason: '',
      operator: '',
    })
    setAddSupplementModalOpen(true)
  }

  const handleSubmitSupplement = async () => {
    if (!newSupplementData.reason) {
      alert('请输入原因')
      return
    }
    try {
      await createFeeSupplement({
        workerId: newSupplementData.workerId || undefined,
        roomId: newSupplementData.roomId || undefined,
        type: newSupplementData.type,
        amount: Number(newSupplementData.amount),
        reason: newSupplementData.reason,
        operator: newSupplementData.operator,
      })
      setAddSupplementModalOpen(false)
    } catch (e) {
      alert((e as Error).message)
    }
  }

  const handleConfirmSupplement = async (item: FeeSupplement) => {
    try {
      await confirmFeeSupplement(item.id)
    } catch (e) {
      alert((e as Error).message)
    }
  }

  const handlePayClick = (item: FeeSupplement) => {
    setSelectedSupplement(item)
    setPayData({
      payMethod: 'cash',
      transactionNo: '',
      operator: '',
    })
    setPaySupplementModalOpen(true)
  }

  const handlePaySubmit = async () => {
    if (!selectedSupplement) return
    try {
      await payFeeSupplement(selectedSupplement.id, {
        payMethod: payData.payMethod,
        transactionNo: payData.transactionNo || undefined,
        operator: payData.operator || undefined,
      })
      setPaySupplementModalOpen(false)
      setSelectedSupplement(null)
    } catch (e) {
      alert((e as Error).message)
    }
  }

  const handleDeleteSupplement = async (item: FeeSupplement) => {
    if (!confirm('确定要删除该补缴记录吗？')) return
    try {
      await removeFeeSupplement(item.id)
    } catch (e) {
      alert((e as Error).message)
    }
  }

  const handleAddReceipt = () => {
    setNewReceiptData({
      type: 'deposit',
      payerName: '',
      payerType: 'worker',
      amount: '',
      payMethod: 'cash',
      transactionNo: '',
      operator: '',
      items: [],
    })
    setAddReceiptModalOpen(true)
  }

  const handleSubmitReceipt = async () => {
    if (!newReceiptData.payerName) {
      alert('请输入付款方名称')
      return
    }
    try {
      await createReceipt({
        type: newReceiptData.type,
        payerName: newReceiptData.payerName,
        payerType: newReceiptData.payerType,
        amount: Number(newReceiptData.amount),
        payMethod: newReceiptData.payMethod,
        transactionNo: newReceiptData.transactionNo || undefined,
        operator: newReceiptData.operator,
        items: newReceiptData.items.map((it) => ({
          name: it.name,
          description: it.description,
          amount: Number(it.amount),
        })),
      })
      setAddReceiptModalOpen(false)
    } catch (e) {
      alert((e as Error).message)
    }
  }

  const handlePrintReceipt = async (item: Receipt) => {
    try {
      await printReceipt(item.id)
    } catch (e) {
      alert((e as Error).message)
    }
  }

  const handleDeleteReceipt = async (item: Receipt) => {
    if (!confirm('确定要删除该票据吗？')) return
    try {
      await removeReceipt(item.id)
    } catch (e) {
      alert((e as Error).message)
    }
  }

  const addReceiptItem = () => {
    setNewReceiptData({
      ...newReceiptData,
      items: [...newReceiptData.items, { name: '', description: '', amount: '' }],
    })
  }

  const removeReceiptItem = (index: number) => {
    const items = [...newReceiptData.items]
    items.splice(index, 1)
    setNewReceiptData({ ...newReceiptData, items })
  }

  const updateReceiptItem = (index: number, field: 'name' | 'description' | 'amount', value: string) => {
    const items = [...newReceiptData.items]
    items[index] = { ...items[index], [field]: value }
    setNewReceiptData({ ...newReceiptData, items })
  }

  const getSupplementTypeBadge = (type: FeeSupplement['type']) => {
    const variants: Record<string, 'info' | 'warning' | 'danger' | 'default'> = {
      electricity: 'info',
      water: 'info',
      room: 'warning',
      damage: 'danger',
      cleaning: 'warning',
      key: 'danger',
      other: 'default',
    }
    return <Badge variant={variants[type]}>{FeeSupplementTypeLabel[type]}</Badge>
  }

  const getSupplementStatusBadge = (s: FeeSupplement['status']) => {
    const variants: Record<string, 'warning' | 'info' | 'success'> = {
      pending: 'warning',
      confirmed: 'info',
      paid: 'success',
    }
    return <Badge variant={variants[s]}>{FeeSupplementStatusLabel[s]}</Badge>
  }

  const getReceiptTypeBadge = (type: Receipt['type']) => {
    const variants: Record<string, 'success' | 'info' | 'warning' | 'default'> = {
      deposit: 'success',
      supplement: 'info',
      utility: 'warning',
      other: 'default',
    }
    return <Badge variant={variants[type]}>{ReceiptTypeLabel[type]}</Badge>
  }

  const getPayerTypeBadge = (type: Receipt['payerType']) => {
    const variants: Record<string, 'info' | 'success' | 'default'> = {
      worker: 'info',
      company: 'success',
      other: 'default',
    }
    return <Badge variant={variants[type]}>{PayerTypeLabel[type]}</Badge>
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  }

  const supplementColumns = [
    {
      key: 'workerName',
      label: '工人/房间',
      width: '120px',
      render: (row: FeeSupplement) => (
        <span>{row.workerName || row.roomNumber || '-'}</span>
      ),
    },
    {
      key: 'type',
      label: '类型',
      width: '120px',
      render: (row: FeeSupplement) => getSupplementTypeBadge(row.type),
    },
    {
      key: 'amount',
      label: '金额',
      width: '100px',
      render: (row: FeeSupplement) => (
        <span className="font-medium">¥{row.amount.toFixed(2)}</span>
      ),
    },
    {
      key: 'reason',
      label: '原因',
      width: '150px',
      render: (row: FeeSupplement) => (
        <span className="text-slate-600">{row.reason}</span>
      ),
    },
    {
      key: 'payMethod',
      label: '支付方式',
      width: '100px',
      render: (row: FeeSupplement) => (
        <span>{row.payMethod ? PayMethodLabel[row.payMethod] : '-'}</span>
      ),
    },
    {
      key: 'status',
      label: '状态',
      width: '80px',
      render: (row: FeeSupplement) => getSupplementStatusBadge(row.status),
    },
    {
      key: 'operator',
      label: '操作员',
      width: '80px',
      render: (row: FeeSupplement) => (
        <span className="text-slate-600">{row.operator}</span>
      ),
    },
    {
      key: 'createdAt',
      label: '创建时间',
      width: '120px',
      render: (row: FeeSupplement) => (
        <span className="text-slate-600">{formatDate(row.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      label: '操作',
      width: '200px',
      render: (row: FeeSupplement) => (
        <div className="flex gap-1 flex-wrap">
          {row.status === 'pending' && (
            <Button size="sm" variant="ghost" onClick={() => handleConfirmSupplement(row)}>
              <CheckCircle className="h-4 w-4" />
              确认
            </Button>
          )}
          {row.status === 'confirmed' && (
            <Button size="sm" variant="ghost" onClick={() => handlePayClick(row)}>
              <DollarSign className="h-4 w-4" />
              缴费
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="text-red-500"
            onClick={() => handleDeleteSupplement(row)}
          >
            <Trash2 className="h-4 w-4" />
            删除
          </Button>
        </div>
      ),
    },
  ]

  const receiptColumns = [
    {
      key: 'receiptNo',
      label: '票据编号',
      width: '120px',
      render: (row: Receipt) => (
        <span className="font-mono text-slate-600">{row.receiptNo}</span>
      ),
    },
    {
      key: 'type',
      label: '类型',
      width: '120px',
      render: (row: Receipt) => getReceiptTypeBadge(row.type),
    },
    {
      key: 'payerName',
      label: '付款方',
      width: '100px',
      render: (row: Receipt) => (
        <span>{row.payerName}</span>
      ),
    },
    {
      key: 'payerType',
      label: '付款方类型',
      width: '100px',
      render: (row: Receipt) => getPayerTypeBadge(row.payerType),
    },
    {
      key: 'amount',
      label: '金额',
      width: '100px',
      render: (row: Receipt) => (
        <span className="font-medium">¥{row.amount.toFixed(2)}</span>
      ),
    },
    {
      key: 'payMethod',
      label: '支付方式',
      width: '100px',
      render: (row: Receipt) => (
        <span>{PayMethodLabel[row.payMethod]}</span>
      ),
    },
    {
      key: 'issuedAt',
      label: '开票时间',
      width: '120px',
      render: (row: Receipt) => (
        <span className="text-slate-600">{formatDate(row.issuedAt)}</span>
      ),
    },
    {
      key: 'printCount',
      label: '打印次数',
      width: '80px',
      render: (row: Receipt) => (
        <span className="text-slate-600">{row.printCount}</span>
      ),
    },
    {
      key: 'actions',
      label: '操作',
      width: '160px',
      render: (row: Receipt) => (
        <div className="flex gap-1 flex-wrap">
          <Button size="sm" variant="ghost" onClick={() => handlePrintReceipt(row)}>
            <Printer className="h-4 w-4" />
            打印
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-red-500"
            onClick={() => handleDeleteReceipt(row)}
          >
            <Trash2 className="h-4 w-4" />
            删除
          </Button>
        </div>
      ),
    },
  ]

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'supplement', label: '费用补缴' },
    { key: 'receipt', label: '票据记录' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <StatsCard
          title="补缴总笔数"
          value={feeSupplementStats?.totalRecords || 0}
          icon={<FileText className="h-6 w-6" />}
          color="blue"
        />
        <StatsCard
          title="待确认金额"
          value={`¥${(feeSupplementStats?.pendingAmount || 0).toFixed(2)}`}
          icon={<DollarSign className="h-6 w-6" />}
          color="orange"
        />
        <StatsCard
          title="已确认金额"
          value={`¥${(feeSupplementStats?.confirmedAmount || 0).toFixed(2)}`}
          icon={<CheckCircle className="h-6 w-6" />}
          color="purple"
        />
        <StatsCard
          title="已缴纳金额"
          value={`¥${(feeSupplementStats?.paidAmount || 0).toFixed(2)}`}
          icon={<ReceiptIcon className="h-6 w-6" />}
          color="green"
        />
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'supplement' && (
        <>
          <Card>
            <div className="flex flex-wrap gap-4 items-end">
              <Select
                label="类型"
                value={supplementType}
                onChange={(e) => setSupplementType(e.target.value)}
                options={[
                  { value: '', label: '全部类型' },
                  { value: 'electricity', label: '电费补缴' },
                  { value: 'water', label: '水费补缴' },
                  { value: 'room', label: '房费补缴' },
                  { value: 'damage', label: '物品损坏赔偿' },
                  { value: 'cleaning', label: '清洁费' },
                  { value: 'key', label: '钥匙赔偿' },
                  { value: 'other', label: '其他补缴' },
                ]}
                className="w-36"
              />
              <Select
                label="状态"
                value={supplementStatus}
                onChange={(e) => setSupplementStatus(e.target.value)}
                options={[
                  { value: '', label: '全部状态' },
                  { value: 'pending', label: '待确认' },
                  { value: 'confirmed', label: '已确认' },
                  { value: 'paid', label: '已缴纳' },
                ]}
                className="w-36"
              />
              <Input
                label="关键词"
                placeholder="工人/房间/原因"
                value={supplementKeyword}
                onChange={(e) => setSupplementKeyword(e.target.value)}
                className="w-48"
              />
              <div className="flex gap-2">
                <Button onClick={handleSupplementSearch}>
                  <Filter className="h-4 w-4" />
                  筛选
                </Button>
                <Button variant="secondary" onClick={handleSupplementReset}>
                  <RefreshCw className="h-4 w-4" />
                  重置
                </Button>
              </div>
            </div>
          </Card>

          <Card
            title={`费用补缴 (共 ${filteredFeeSupplements.length} 条)`}
            actions={
              <Button onClick={handleAddSupplement} disabled={loading}>
                <Plus className="h-4 w-4" />
                新增补缴
              </Button>
            }
          >
            <Table columns={supplementColumns} data={filteredFeeSupplements} emptyText="暂无补缴记录" />
          </Card>
        </>
      )}

      {activeTab === 'receipt' && (
        <>
          <Card>
            <div className="flex flex-wrap gap-4 items-end">
              <Select
                label="类型"
                value={receiptType}
                onChange={(e) => setReceiptType(e.target.value)}
                options={[
                  { value: '', label: '全部类型' },
                  { value: 'deposit', label: '押金收据' },
                  { value: 'supplement', label: '补缴收据' },
                  { value: 'utility', label: '水电费收据' },
                  { value: 'other', label: '其他收据' },
                ]}
                className="w-36"
              />
              <Select
                label="付款方类型"
                value={receiptPayerType}
                onChange={(e) => setReceiptPayerType(e.target.value)}
                options={[
                  { value: '', label: '全部类型' },
                  { value: 'worker', label: '工人' },
                  { value: 'company', label: '公司' },
                  { value: 'other', label: '其他' },
                ]}
                className="w-36"
              />
              <Input
                label="开始日期"
                type="date"
                value={receiptDateFrom}
                onChange={(e) => setReceiptDateFrom(e.target.value)}
                className="w-40"
              />
              <Input
                label="结束日期"
                type="date"
                value={receiptDateTo}
                onChange={(e) => setReceiptDateTo(e.target.value)}
                className="w-40"
              />
              <div className="flex gap-2">
                <Button onClick={handleReceiptSearch}>
                  <Filter className="h-4 w-4" />
                  筛选
                </Button>
                <Button variant="secondary" onClick={handleReceiptReset}>
                  <RefreshCw className="h-4 w-4" />
                  重置
                </Button>
              </div>
            </div>
          </Card>

          <Card
            title={`票据记录 (共 ${filteredReceipts.length} 条)`}
            actions={
              <Button onClick={handleAddReceipt} disabled={loading}>
                <Plus className="h-4 w-4" />
                新增票据
              </Button>
            }
          >
            <Table columns={receiptColumns} data={filteredReceipts} emptyText="暂无票据记录" />
          </Card>
        </>
      )}

      <Modal
        open={addSupplementModalOpen}
        title="新增补缴"
        onClose={() => setAddSupplementModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddSupplementModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmitSupplement}>确认</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="工人"
            value={newSupplementData.workerId}
            onChange={(e) => setNewSupplementData({ ...newSupplementData, workerId: e.target.value })}
            options={[
              { value: '', label: '请选择工人（可选）' },
              ...workers.map((w: any) => ({ value: w.id, label: w.name })),
            ]}
          />
          <Select
            label="房间"
            value={newSupplementData.roomId}
            onChange={(e) => setNewSupplementData({ ...newSupplementData, roomId: e.target.value })}
            options={[
              { value: '', label: '请选择房间（可选）' },
              ...rooms.map((r: any) => ({ value: r.id, label: r.roomNumber })),
            ]}
          />
          <Select
            label="类型"
            value={newSupplementData.type}
            onChange={(e) => setNewSupplementData({ ...newSupplementData, type: e.target.value as FeeSupplement['type'] })}
            options={[
              { value: 'electricity', label: '电费补缴' },
              { value: 'water', label: '水费补缴' },
              { value: 'room', label: '房费补缴' },
              { value: 'damage', label: '物品损坏赔偿' },
              { value: 'cleaning', label: '清洁费' },
              { value: 'key', label: '钥匙赔偿' },
              { value: 'other', label: '其他补缴' },
            ]}
          />
          <Input
            label="金额"
            type="number"
            placeholder="请输入金额"
            value={newSupplementData.amount}
            onChange={(e) => setNewSupplementData({ ...newSupplementData, amount: e.target.value })}
          />
          <Input
            label="原因"
            placeholder="请输入原因"
            value={newSupplementData.reason}
            onChange={(e) => setNewSupplementData({ ...newSupplementData, reason: e.target.value })}
          />
          <Input
            label="操作员"
            placeholder="请输入操作员"
            value={newSupplementData.operator}
            onChange={(e) => setNewSupplementData({ ...newSupplementData, operator: e.target.value })}
          />
        </div>
      </Modal>

      <Modal
        open={paySupplementModalOpen}
        title="缴费"
        onClose={() => setPaySupplementModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPaySupplementModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handlePaySubmit}>确认缴费</Button>
          </>
        }
      >
        <div className="space-y-4">
          {selectedSupplement && (
            <div className="text-sm text-slate-500">
              缴费金额：<span className="font-medium text-slate-700">¥{selectedSupplement.amount.toFixed(2)}</span>
            </div>
          )}
          <Select
            label="支付方式"
            value={payData.payMethod}
            onChange={(e) => setPayData({ ...payData, payMethod: e.target.value as FeeSupplement['payMethod'] })}
            options={[
              { value: 'cash', label: '现金' },
              { value: 'bank_transfer', label: '银行转账' },
              { value: 'wechat', label: '微信' },
              { value: 'alipay', label: '支付宝' },
              { value: 'deduction', label: '工资扣除' },
              { value: 'other', label: '其他' },
            ]}
          />
          <Input
            label="交易号"
            placeholder="请输入交易号（可选）"
            value={payData.transactionNo}
            onChange={(e) => setPayData({ ...payData, transactionNo: e.target.value })}
          />
          <Input
            label="操作员"
            placeholder="请输入操作员"
            value={payData.operator}
            onChange={(e) => setPayData({ ...payData, operator: e.target.value })}
          />
        </div>
      </Modal>

      <Modal
        open={addReceiptModalOpen}
        title="新增票据"
        onClose={() => setAddReceiptModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddReceiptModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmitReceipt}>确认</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="类型"
            value={newReceiptData.type}
            onChange={(e) => setNewReceiptData({ ...newReceiptData, type: e.target.value as Receipt['type'] })}
            options={[
              { value: 'deposit', label: '押金收据' },
              { value: 'supplement', label: '补缴收据' },
              { value: 'utility', label: '水电费收据' },
              { value: 'other', label: '其他收据' },
            ]}
          />
          <Input
            label="付款方名称"
            placeholder="请输入付款方名称"
            value={newReceiptData.payerName}
            onChange={(e) => setNewReceiptData({ ...newReceiptData, payerName: e.target.value })}
          />
          <Select
            label="付款方类型"
            value={newReceiptData.payerType}
            onChange={(e) => setNewReceiptData({ ...newReceiptData, payerType: e.target.value as Receipt['payerType'] })}
            options={[
              { value: 'worker', label: '工人' },
              { value: 'company', label: '公司' },
              { value: 'other', label: '其他' },
            ]}
          />
          <Input
            label="金额"
            type="number"
            placeholder="请输入金额"
            value={newReceiptData.amount}
            onChange={(e) => setNewReceiptData({ ...newReceiptData, amount: e.target.value })}
          />
          <Select
            label="支付方式"
            value={newReceiptData.payMethod}
            onChange={(e) => setNewReceiptData({ ...newReceiptData, payMethod: e.target.value as Receipt['payMethod'] })}
            options={[
              { value: 'cash', label: '现金' },
              { value: 'bank_transfer', label: '银行转账' },
              { value: 'wechat', label: '微信' },
              { value: 'alipay', label: '支付宝' },
              { value: 'deduction', label: '工资扣除' },
              { value: 'other', label: '其他' },
            ]}
          />
          <Input
            label="交易号"
            placeholder="请输入交易号（可选）"
            value={newReceiptData.transactionNo}
            onChange={(e) => setNewReceiptData({ ...newReceiptData, transactionNo: e.target.value })}
          />
          <Input
            label="操作员"
            placeholder="请输入操作员"
            value={newReceiptData.operator}
            onChange={(e) => setNewReceiptData({ ...newReceiptData, operator: e.target.value })}
          />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">明细项目</span>
              <Button size="sm" variant="ghost" onClick={addReceiptItem}>
                <Plus className="h-4 w-4" />
                添加明细
              </Button>
            </div>
            {newReceiptData.items.length === 0 && (
              <div className="text-sm text-slate-400 py-2">暂无明细项</div>
            )}
            {newReceiptData.items.map((item, index) => (
              <div key={index} className="flex gap-2 items-end">
                <Input
                  placeholder="名称"
                  value={item.name}
                  onChange={(e) => updateReceiptItem(index, 'name', e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="描述"
                  value={item.description}
                  onChange={(e) => updateReceiptItem(index, 'description', e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="金额"
                  type="number"
                  value={item.amount}
                  onChange={(e) => updateReceiptItem(index, 'amount', e.target.value)}
                  className="w-24"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-500"
                  onClick={() => removeReceiptItem(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  )
}
