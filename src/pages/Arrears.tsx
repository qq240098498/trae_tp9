import { useEffect, useMemo, useState } from 'react'
import { Card, Input, Select, Button, Badge, Table, Modal, StatsCard, Textarea } from '../components/UI'
import { useDormitoryStore } from '../store/dormitory'
import { ArrearWarningLevelLabel, ArrearStatusLabel, CollectionTypeLabel } from '../types'
import type { UtilityArrear } from '../types'
import {
  AlertTriangle,
  Phone,
  RefreshCw,
  DollarSign,
  Edit2,
  Trash2,
  Filter,
  Clock,
  Bell,
  Plus,
  CheckCircle,
  XCircle,
} from 'lucide-react'

export default function Arrears() {
  const {
    utilityArrears,
    loading,
    fetchArrears,
    createArrear,
    collectArrear,
    payArrear,
    writeOffArrear,
    removeArrear,
  } = useDormitoryStore()

  const [warningLevel, setWarningLevel] = useState('')
  const [status, setStatus] = useState('')
  const [keyword, setKeyword] = useState('')

  const [collectModalOpen, setCollectModalOpen] = useState(false)
  const [payModalOpen, setPayModalOpen] = useState(false)
  const [generateModalOpen, setGenerateModalOpen] = useState(false)
  const [selectedArrear, setSelectedArrear] = useState<UtilityArrear | null>(null)
  const [collectData, setCollectData] = useState({
    collectionType: '',
    workerId: '',
    content: '',
    response: '',
    effect: '',
    remark: '',
  })
  const [payAmount, setPayAmount] = useState('')
  const [billId, setBillId] = useState('')

  useEffect(() => {
    fetchArrears()
  }, [fetchArrears])

  const pendingCollectingCount = useMemo(() => {
    return utilityArrears.filter((a) => a.status === 'pending' || a.status === 'collecting').length
  }, [utilityArrears])

  const warningCount = useMemo(() => {
    return utilityArrears.filter((a) => a.warningLevel === 'warning').length
  }, [utilityArrears])

  const urgentCount = useMemo(() => {
    return utilityArrears.filter((a) => a.warningLevel === 'urgent' || a.warningLevel === 'critical').length
  }, [utilityArrears])

  const paidCount = useMemo(() => {
    return utilityArrears.filter((a) => a.status === 'paid').length
  }, [utilityArrears])

  const filteredArrears = useMemo(() => {
    let list = [...utilityArrears].sort((a, b) => b.overdueDays - a.overdueDays)
    if (warningLevel) {
      list = list.filter((a) => a.warningLevel === warningLevel)
    }
    if (status) {
      list = list.filter((a) => a.status === status)
    }
    if (keyword.trim()) {
      const kw = keyword.trim().toLowerCase()
      list = list.filter(
        (a) =>
          a.roomNumber.toLowerCase().includes(kw) ||
          a.workerNames.some((n) => n.toLowerCase().includes(kw)),
      )
    }
    return list
  }, [utilityArrears, warningLevel, status, keyword])

  const handleSearch = () => {
    fetchArrears()
  }

  const handleReset = () => {
    setWarningLevel('')
    setStatus('')
    setKeyword('')
  }

  const handleCollectClick = (arrear: UtilityArrear) => {
    setSelectedArrear(arrear)
    setCollectData({
      collectionType: '',
      workerId: '',
      content: '',
      response: '',
      effect: '',
      remark: '',
    })
    setCollectModalOpen(true)
  }

  const handleCollect = async () => {
    if (!selectedArrear) return
    if (!collectData.collectionType) {
      alert('请选择催收方式')
      return
    }
    if (!collectData.content) {
      alert('请输入催收内容')
      return
    }
    try {
      await collectArrear(selectedArrear.id, {
        collectionType: collectData.collectionType,
        content: collectData.content,
        operator: 'admin',
        workerId: collectData.workerId || undefined,
        response: collectData.response || undefined,
        effect: collectData.effect || undefined,
        remark: collectData.remark || undefined,
      })
      setCollectModalOpen(false)
      setSelectedArrear(null)
    } catch (e) {
      alert((e as Error).message)
    }
  }

  const handlePayClick = (arrear: UtilityArrear) => {
    setSelectedArrear(arrear)
    setPayAmount('')
    setPayModalOpen(true)
  }

  const handlePay = async () => {
    if (!selectedArrear) return
    const amount = parseFloat(payAmount)
    if (!amount || amount <= 0) {
      alert('请输入有效的缴费金额')
      return
    }
    if (amount > selectedArrear.unpaidAmount) {
      alert('缴费金额不能超过未缴金额')
      return
    }
    try {
      await payArrear(selectedArrear.id, { paidAmount: amount })
      setPayModalOpen(false)
      setSelectedArrear(null)
    } catch (e) {
      alert((e as Error).message)
    }
  }

  const handleWriteOff = async (arrear: UtilityArrear) => {
    if (!confirm(`确定要核销 ${arrear.roomNumber} 的欠费记录吗？`)) return
    try {
      await writeOffArrear(arrear.id)
    } catch (e) {
      alert((e as Error).message)
    }
  }

  const handleDelete = async (arrear: UtilityArrear) => {
    if (!confirm(`确定要删除 ${arrear.roomNumber} 的欠费记录吗？`)) return
    try {
      await removeArrear(arrear.id)
    } catch (e) {
      alert((e as Error).message)
    }
  }

  const handleGenerate = async () => {
    if (!billId.trim()) {
      alert('请输入账单ID')
      return
    }
    try {
      await createArrear({ billId: billId.trim() })
      setGenerateModalOpen(false)
      setBillId('')
    } catch (e) {
      alert((e as Error).message)
    }
  }

  const getWarningLevelBadge = (level: UtilityArrear['warningLevel']) => {
    const variants: Record<string, 'success' | 'warning' | 'danger'> = {
      normal: 'success',
      warning: 'warning',
      urgent: 'danger',
      critical: 'danger',
    }
    return <Badge variant={variants[level]}>{ArrearWarningLevelLabel[level]}</Badge>
  }

  const getStatusBadge = (s: UtilityArrear['status']) => {
    const variants: Record<string, 'warning' | 'info' | 'success' | 'default'> = {
      pending: 'warning',
      collecting: 'info',
      partial_paid: 'warning',
      paid: 'success',
      written_off: 'default',
    }
    return <Badge variant={variants[s]}>{ArrearStatusLabel[s]}</Badge>
  }

  const getOverdueDaysDisplay = (days: number) => {
    if (days > 0) return <span className="text-red-600 font-medium">逾期{days}天</span>
    if (days === 0) return <span className="text-yellow-600 font-medium">今日到期</span>
    return <span className="text-green-600 font-medium">还剩{Math.abs(days)}天</span>
  }

  const columns = [
    {
      key: 'roomNumber',
      label: '房间号',
      width: '90px',
    },
    {
      key: 'buildingName',
      label: '楼栋',
      width: '100px',
    },
    {
      key: 'billingPeriod',
      label: '账期',
      width: '100px',
    },
    {
      key: 'totalAmount',
      label: '欠费金额',
      width: '100px',
      render: (row: UtilityArrear) => (
        <span className="font-medium text-red-600">¥{row.totalAmount.toFixed(2)}</span>
      ),
    },
    {
      key: 'paidAmount',
      label: '已缴金额',
      width: '100px',
      render: (row: UtilityArrear) => (
        <span className="text-green-600">¥{row.paidAmount.toFixed(2)}</span>
      ),
    },
    {
      key: 'overdueDays',
      label: '逾期天数',
      width: '100px',
      render: (row: UtilityArrear) => getOverdueDaysDisplay(row.overdueDays),
    },
    {
      key: 'warningLevel',
      label: '预警级别',
      width: '90px',
      render: (row: UtilityArrear) => getWarningLevelBadge(row.warningLevel),
    },
    {
      key: 'status',
      label: '状态',
      width: '90px',
      render: (row: UtilityArrear) => getStatusBadge(row.status),
    },
    {
      key: 'collectionCount',
      label: '催收次数',
      width: '80px',
    },
    {
      key: 'actions',
      label: '操作',
      width: '280px',
      render: (row: UtilityArrear) => (
        <div className="flex gap-1 flex-wrap">
          {(row.status === 'pending' || row.status === 'collecting' || row.status === 'partial_paid') && (
            <Button size="sm" variant="ghost" onClick={() => handleCollectClick(row)}>
              <Phone className="h-4 w-4" />
              催收
            </Button>
          )}
          {row.status !== 'paid' && row.status !== 'written_off' && (
            <Button size="sm" variant="ghost" onClick={() => handlePayClick(row)}>
              <DollarSign className="h-4 w-4" />
              缴费
            </Button>
          )}
          {(row.status === 'pending' || row.status === 'collecting' || row.status === 'partial_paid') && (
            <Button size="sm" variant="ghost" onClick={() => handleWriteOff(row)}>
              <CheckCircle className="h-4 w-4" />
              核销
            </Button>
          )}
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
          title="待催收"
          value={pendingCollectingCount}
          icon={<Bell className="h-6 w-6" />}
          color="orange"
        />
        <StatsCard
          title="预警中"
          value={warningCount}
          icon={<AlertTriangle className="h-6 w-6" />}
          color="blue"
        />
        <StatsCard
          title="紧急欠费"
          value={urgentCount}
          icon={<Clock className="h-6 w-6" />}
          color="red"
        />
        <StatsCard
          title="已缴清"
          value={paidCount}
          icon={<CheckCircle className="h-6 w-6" />}
          color="green"
        />
      </div>

      <Card>
        <div className="flex flex-wrap gap-4 items-end">
          <Select
            label="预警级别"
            value={warningLevel}
            onChange={(e) => setWarningLevel(e.target.value)}
            options={[
              { value: '', label: '全部级别' },
              { value: 'normal', label: '正常' },
              { value: 'warning', label: '预警' },
              { value: 'urgent', label: '紧急' },
              { value: 'critical', label: '严重' },
            ]}
            className="w-36"
          />
          <Select
            label="状态"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: '', label: '全部状态' },
              { value: 'pending', label: '待处理' },
              { value: 'collecting', label: '催收中' },
              { value: 'partial_paid', label: '部分缴纳' },
              { value: 'paid', label: '已缴清' },
              { value: 'written_off', label: '已核销' },
            ]}
            className="w-36"
          />
          <Input
            label="关键词"
            placeholder="房间号/工人姓名"
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
        title={`欠费记录 (共 ${filteredArrears.length} 条)`}
        actions={
          <Button onClick={() => setGenerateModalOpen(true)} disabled={loading}>
            <Plus className="h-4 w-4" />
            从账单生成
          </Button>
        }
      >
        <Table columns={columns} data={filteredArrears} emptyText="暂无欠费记录" />
      </Card>

      <Modal
        open={collectModalOpen}
        title="催收"
        onClose={() => setCollectModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setCollectModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCollect}>确认</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="催收方式"
            value={collectData.collectionType}
            onChange={(e) => setCollectData({ ...collectData, collectionType: e.target.value })}
            options={[
              { value: '', label: '请选择催收方式' },
              { value: 'notice', label: '书面通知' },
              { value: 'sms', label: '短信通知' },
              { value: 'call', label: '电话催收' },
              { value: 'visit', label: '上门催收' },
              { value: 'deduction', label: '工资扣除' },
            ]}
          />
          <Input
            label="工人ID"
            placeholder="工人ID（选填）"
            value={collectData.workerId}
            onChange={(e) => setCollectData({ ...collectData, workerId: e.target.value })}
          />
          <Textarea
            label="催收内容"
            placeholder="请输入催收内容"
            value={collectData.content}
            onChange={(e) => setCollectData({ ...collectData, content: e.target.value })}
            rows={3}
          />
          <Textarea
            label="对方回应"
            placeholder="对方回应（选填）"
            value={collectData.response}
            onChange={(e) => setCollectData({ ...collectData, response: e.target.value })}
            rows={2}
          />
          <Textarea
            label="效果"
            placeholder="催收效果（选填）"
            value={collectData.effect}
            onChange={(e) => setCollectData({ ...collectData, effect: e.target.value })}
            rows={2}
          />
          <Textarea
            label="备注"
            placeholder="备注信息（选填）"
            value={collectData.remark}
            onChange={(e) => setCollectData({ ...collectData, remark: e.target.value })}
            rows={2}
          />
        </div>
      </Modal>

      <Modal
        open={payModalOpen}
        title="缴费"
        onClose={() => setPayModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPayModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handlePay}>确认缴费</Button>
          </>
        }
      >
        <div className="space-y-4">
          {selectedArrear && (
            <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">总金额</span>
                <span className="font-medium">¥{selectedArrear.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">已缴</span>
                <span className="text-green-600">¥{selectedArrear.paidAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">未缴</span>
                <span className="text-red-600 font-medium">¥{selectedArrear.unpaidAmount.toFixed(2)}</span>
              </div>
            </div>
          )}
          <Input
            label="缴费金额"
            type="number"
            placeholder="请输入缴费金额"
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
          />
        </div>
      </Modal>

      <Modal
        open={generateModalOpen}
        title="从账单生成欠费记录"
        onClose={() => setGenerateModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setGenerateModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleGenerate}>生成</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="账单ID"
            placeholder="请输入账单ID"
            value={billId}
            onChange={(e) => setBillId(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  )
}
