import { useEffect, useMemo, useState } from 'react'
import { Card, Input, Select, Button, Badge, Table, Modal, StatsCard, Textarea } from '../components/UI'
import { useDormitoryStore } from '../store/dormitory'
import { DepositTypeLabel, PayMethodLabel, DepositAccountStatusLabel } from '../types'
import type { Deposit, DepositAccount } from '../types'
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  DollarSign,
  Plus,
  RefreshCw,
  Filter,
  Edit2,
  Trash2,
  UserPlus,
  Eye,
} from 'lucide-react'

export default function Deposit() {
  const {
    depositAccounts,
    depositTransactions,
    depositStats,
    workers,
    loading,
    fetchDepositAccounts,
    fetchDepositTransactions,
    fetchDepositStats,
    fetchWorkers,
    initializeDepositAccount,
    updateDepositAccount,
    createDepositTransaction,
    removeDepositTransaction,
  } = useDormitoryStore()

  const [activeTab, setActiveTab] = useState<'accounts' | 'transactions'>('accounts')

  const [accountStatus, setAccountStatus] = useState('')
  const [accountKeyword, setAccountKeyword] = useState('')

  const [transactionType, setTransactionType] = useState('')
  const [transactionPayMethod, setTransactionPayMethod] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const [initModalOpen, setInitModalOpen] = useState(false)
  const [initData, setInitData] = useState({ workerId: '', remark: '' })

  const [addTransactionModalOpen, setAddTransactionModalOpen] = useState(false)
  const [transactionData, setTransactionData] = useState({
    workerId: '',
    type: '' as Deposit['type'] | '',
    amount: '',
    payMethod: '' as Deposit['payMethod'] | '',
    transactionNo: '',
    remark: '',
  })

  useEffect(() => {
    fetchDepositAccounts()
    fetchDepositTransactions()
    fetchDepositStats()
    fetchWorkers()
  }, [fetchDepositAccounts, fetchDepositTransactions, fetchDepositStats, fetchWorkers])

  const filteredAccounts = useMemo(() => {
    let list = [...depositAccounts]
    if (accountStatus) {
      list = list.filter((a) => a.status === accountStatus)
    }
    if (accountKeyword.trim()) {
      const kw = accountKeyword.trim().toLowerCase()
      list = list.filter(
        (a) =>
          a.workerName.toLowerCase().includes(kw) ||
          a.workerPhone.includes(kw),
      )
    }
    return list
  }, [depositAccounts, accountStatus, accountKeyword])

  const filteredTransactions = useMemo(() => {
    let list = [...depositTransactions]
    if (transactionType) {
      list = list.filter((t) => t.type === transactionType)
    }
    if (transactionPayMethod) {
      list = list.filter((t) => t.payMethod === transactionPayMethod)
    }
    if (startDate) {
      list = list.filter((t) => t.operatedAt >= startDate)
    }
    if (endDate) {
      list = list.filter((t) => t.operatedAt <= endDate + 'T23:59:59')
    }
    return list
  }, [depositTransactions, transactionType, transactionPayMethod, startDate, endDate])

  const handleResetAccounts = () => {
    setAccountStatus('')
    setAccountKeyword('')
  }

  const handleResetTransactions = () => {
    setTransactionType('')
    setTransactionPayMethod('')
    setStartDate('')
    setEndDate('')
  }

  const handleInitAccount = async () => {
    if (!initData.workerId) {
      alert('请选择工人')
      return
    }
    try {
      await initializeDepositAccount({
        workerId: initData.workerId,
        remark: initData.remark || undefined,
      })
      setInitModalOpen(false)
      setInitData({ workerId: '', remark: '' })
    } catch (e) {
      alert((e as Error).message)
    }
  }

  const handleToggleFreeze = async (account: DepositAccount) => {
    const newStatus = account.status === 'frozen' ? 'active' : 'frozen'
    try {
      await updateDepositAccount(account.workerId, { status: newStatus })
    } catch (e) {
      alert((e as Error).message)
    }
  }

  const handleViewTransactions = (account: DepositAccount) => {
    setTransactionType('')
    setTransactionPayMethod('')
    setStartDate('')
    setEndDate('')
    setActiveTab('transactions')
    fetchDepositTransactions({ workerId: account.workerId })
  }

  const handleAddTransaction = async () => {
    if (!transactionData.workerId) {
      alert('请选择工人')
      return
    }
    if (!transactionData.type) {
      alert('请选择交易类型')
      return
    }
    if (!transactionData.amount || Number(transactionData.amount) <= 0) {
      alert('请输入有效金额')
      return
    }
    if (!transactionData.payMethod) {
      alert('请选择支付方式')
      return
    }
    try {
      await createDepositTransaction({
        workerId: transactionData.workerId,
        type: transactionData.type,
        amount: Number(transactionData.amount),
        payMethod: transactionData.payMethod,
        transactionNo: transactionData.transactionNo || undefined,
        remark: transactionData.remark || undefined,
      })
      setAddTransactionModalOpen(false)
      setTransactionData({
        workerId: '',
        type: '',
        amount: '',
        payMethod: '',
        transactionNo: '',
        remark: '',
      })
    } catch (e) {
      alert((e as Error).message)
    }
  }

  const handleDeleteTransaction = async (transaction: Deposit) => {
    if (!confirm(`确定要删除 ${transaction.workerName} 的交易记录吗？`)) return
    try {
      await removeDepositTransaction(transaction.id)
    } catch (e) {
      alert((e as Error).message)
    }
  }

  const getTypeBadge = (type: Deposit['type']) => {
    const variants: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
      receive: 'success',
      refund: 'info',
      partial_refund: 'warning',
      deduction: 'danger',
    }
    return <Badge variant={variants[type]}>{DepositTypeLabel[type]}</Badge>
  }

  const getAccountStatusBadge = (status: DepositAccount['status']) => {
    const variants: Record<string, 'success' | 'warning' | 'default'> = {
      active: 'success',
      frozen: 'warning',
      closed: 'default',
    }
    return <Badge variant={variants[status]}>{DepositAccountStatusLabel[status]}</Badge>
  }

  const formatAmount = (amount: number) => `¥${amount.toFixed(2)}`

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const accountColumns = [
    {
      key: 'workerName',
      label: '工人姓名',
      width: '100px',
    },
    {
      key: 'workerPhone',
      label: '电话',
      width: '120px',
    },
    {
      key: 'roomNumber',
      label: '房间',
      width: '80px',
      render: (row: DepositAccount) => (
        <span className="text-slate-600">{row.roomNumber || '-'}</span>
      ),
    },
    {
      key: 'totalReceived',
      label: '累计收取',
      width: '100px',
      render: (row: DepositAccount) => (
        <span className="text-green-600 font-medium">{formatAmount(row.totalReceived)}</span>
      ),
    },
    {
      key: 'totalRefunded',
      label: '累计退还',
      width: '100px',
      render: (row: DepositAccount) => (
        <span className="text-blue-600 font-medium">{formatAmount(row.totalRefunded)}</span>
      ),
    },
    {
      key: 'totalDeducted',
      label: '累计扣除',
      width: '100px',
      render: (row: DepositAccount) => (
        <span className="text-red-600 font-medium">{formatAmount(row.totalDeducted)}</span>
      ),
    },
    {
      key: 'balance',
      label: '当前余额',
      width: '100px',
      render: (row: DepositAccount) => (
        <span className="font-semibold">{formatAmount(row.balance)}</span>
      ),
    },
    {
      key: 'status',
      label: '状态',
      width: '80px',
      render: (row: DepositAccount) => getAccountStatusBadge(row.status),
    },
    {
      key: 'actions',
      label: '操作',
      width: '260px',
      render: (row: DepositAccount) => (
        <div className="flex gap-1 flex-wrap">
          {row.status === 'closed' && (
            <Button size="sm" variant="ghost" onClick={() => {
              setInitData({ workerId: row.workerId, remark: '' })
              setInitModalOpen(true)
            }}>
              <UserPlus className="h-4 w-4" />
              初始化账户
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => handleViewTransactions(row)}>
            <Eye className="h-4 w-4" />
            收支明细
          </Button>
          {row.status !== 'closed' && (
            <Button size="sm" variant="ghost" onClick={() => handleToggleFreeze(row)}>
              {row.status === 'frozen' ? '解冻' : '冻结'}
            </Button>
          )}
        </div>
      ),
    },
  ]

  const transactionColumns = [
    {
      key: 'workerName',
      label: '工人姓名',
      width: '100px',
    },
    {
      key: 'type',
      label: '类型',
      width: '100px',
      render: (row: Deposit) => getTypeBadge(row.type),
    },
    {
      key: 'amount',
      label: '金额',
      width: '100px',
      render: (row: Deposit) => (
        <span className={`font-medium ${row.type === 'receive' ? 'text-green-600' : 'text-red-600'}`}>
          {row.type === 'receive' ? '+' : '-'}{formatAmount(row.amount)}
        </span>
      ),
    },
    {
      key: 'balance',
      label: '余额',
      width: '100px',
      render: (row: Deposit) => (
        <span className="font-semibold">{formatAmount(row.balance)}</span>
      ),
    },
    {
      key: 'payMethod',
      label: '支付方式',
      width: '90px',
      render: (row: Deposit) => (
        <Badge>{PayMethodLabel[row.payMethod]}</Badge>
      ),
    },
    {
      key: 'transactionNo',
      label: '交易号',
      width: '120px',
      render: (row: Deposit) => (
        <span className="text-slate-500 text-sm">{row.transactionNo || '-'}</span>
      ),
    },
    {
      key: 'operator',
      label: '操作员',
      width: '80px',
    },
    {
      key: 'operatedAt',
      label: '操作时间',
      width: '140px',
      render: (row: Deposit) => (
        <span className="text-slate-600 text-sm">{formatDate(row.operatedAt)}</span>
      ),
    },
    {
      key: 'actions',
      label: '操作',
      width: '80px',
      render: (row: Deposit) => (
        <Button
          size="sm"
          variant="ghost"
          className="text-red-500"
          onClick={() => handleDeleteTransaction(row)}
        >
          <Trash2 className="h-4 w-4" />
          删除
        </Button>
      ),
    },
  ]

  const activeAccounts = depositAccounts.filter((a) => a.status === 'active')

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <StatsCard
          title="账户总数"
          value={depositStats?.totalAccounts || 0}
          icon={<Wallet className="h-6 w-6" />}
          color="blue"
        />
        <StatsCard
          title="活跃账户"
          value={depositStats?.activeAccounts || 0}
          icon={<DollarSign className="h-6 w-6" />}
          color="green"
        />
        <StatsCard
          title="累计收取"
          value={`¥${(depositStats?.totalReceived || 0).toFixed(2)}`}
          icon={<ArrowDownCircle className="h-6 w-6" />}
          color="orange"
        />
        <StatsCard
          title="当前余额"
          value={`¥${(depositStats?.totalBalance || 0).toFixed(2)}`}
          icon={<ArrowUpCircle className="h-6 w-6" />}
          color="purple"
        />
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        <button
          className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'accounts' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('accounts')}
        >
          押金账户
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'transactions' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('transactions')}
        >
          收支记录
        </button>
      </div>

      {activeTab === 'accounts' && (
        <>
          <Card>
            <div className="flex flex-wrap gap-4 items-end">
              <Select
                label="状态"
                value={accountStatus}
                onChange={(e) => setAccountStatus(e.target.value)}
                options={[
                  { value: '', label: '全部状态' },
                  { value: 'active', label: '正常' },
                  { value: 'frozen', label: '冻结' },
                  { value: 'closed', label: '已销户' },
                ]}
                className="w-36"
              />
              <Input
                label="关键词"
                placeholder="姓名/电话"
                value={accountKeyword}
                onChange={(e) => setAccountKeyword(e.target.value)}
                className="w-48"
              />
              <div className="flex gap-2">
                <Button onClick={() => fetchDepositAccounts()}>
                  <Filter className="h-4 w-4" />
                  筛选
                </Button>
                <Button variant="secondary" onClick={handleResetAccounts}>
                  <RefreshCw className="h-4 w-4" />
                  重置
                </Button>
              </div>
            </div>
          </Card>

          <Card
            title={`押金账户 (共 ${filteredAccounts.length} 个)`}
            actions={
              <Button onClick={() => setInitModalOpen(true)} disabled={loading}>
                <UserPlus className="h-4 w-4" />
                初始化账户
              </Button>
            }
          >
            <Table columns={accountColumns} data={filteredAccounts} emptyText="暂无押金账户" />
          </Card>
        </>
      )}

      {activeTab === 'transactions' && (
        <>
          <Card>
            <div className="flex flex-wrap gap-4 items-end">
              <Select
                label="类型"
                value={transactionType}
                onChange={(e) => setTransactionType(e.target.value)}
                options={[
                  { value: '', label: '全部类型' },
                  { value: 'receive', label: '收取押金' },
                  { value: 'refund', label: '全额退还' },
                  { value: 'partial_refund', label: '部分退还' },
                  { value: 'deduction', label: '扣除押金' },
                ]}
                className="w-36"
              />
              <Select
                label="支付方式"
                value={transactionPayMethod}
                onChange={(e) => setTransactionPayMethod(e.target.value)}
                options={[
                  { value: '', label: '全部方式' },
                  { value: 'cash', label: '现金' },
                  { value: 'bank_transfer', label: '银行转账' },
                  { value: 'wechat', label: '微信' },
                  { value: 'alipay', label: '支付宝' },
                  { value: 'deduction', label: '工资扣除' },
                  { value: 'other', label: '其他' },
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
                <Button onClick={() => fetchDepositTransactions()}>
                  <Filter className="h-4 w-4" />
                  筛选
                </Button>
                <Button variant="secondary" onClick={handleResetTransactions}>
                  <RefreshCw className="h-4 w-4" />
                  重置
                </Button>
              </div>
            </div>
          </Card>

          <Card
            title={`收支记录 (共 ${filteredTransactions.length} 条)`}
            actions={
              <Button onClick={() => setAddTransactionModalOpen(true)} disabled={loading}>
                <Plus className="h-4 w-4" />
                新增交易
              </Button>
            }
          >
            <Table columns={transactionColumns} data={filteredTransactions} emptyText="暂无收支记录" />
          </Card>
        </>
      )}

      <Modal
        open={initModalOpen}
        title="初始化押金账户"
        onClose={() => setInitModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setInitModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleInitAccount}>确认</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="选择工人"
            value={initData.workerId}
            onChange={(e) => setInitData({ ...initData, workerId: e.target.value })}
            options={[
              { value: '', label: '请选择工人' },
              ...workers.map((w: any) => ({
                value: w.id,
                label: `${w.name} (${w.phone})`,
              })),
            ]}
          />
          <Textarea
            label="备注"
            placeholder="请输入备注信息"
            value={initData.remark}
            onChange={(e) => setInitData({ ...initData, remark: e.target.value })}
            rows={3}
          />
        </div>
      </Modal>

      <Modal
        open={addTransactionModalOpen}
        title="新增交易"
        onClose={() => setAddTransactionModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddTransactionModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleAddTransaction}>确认</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="工人"
            value={transactionData.workerId}
            onChange={(e) => setTransactionData({ ...transactionData, workerId: e.target.value })}
            options={[
              { value: '', label: '请选择工人' },
              ...activeAccounts.map((a) => ({
                value: a.workerId,
                label: `${a.workerName} (${a.workerPhone})`,
              })),
            ]}
          />
          <Select
            label="类型"
            value={transactionData.type}
            onChange={(e) => setTransactionData({ ...transactionData, type: e.target.value as Deposit['type'] })}
            options={[
              { value: '', label: '请选择类型' },
              { value: 'receive', label: '收取押金' },
              { value: 'refund', label: '全额退还' },
              { value: 'partial_refund', label: '部分退还' },
              { value: 'deduction', label: '扣除押金' },
            ]}
          />
          <Input
            label="金额"
            type="number"
            placeholder="请输入金额"
            value={transactionData.amount}
            onChange={(e) => setTransactionData({ ...transactionData, amount: e.target.value })}
          />
          <Select
            label="支付方式"
            value={transactionData.payMethod}
            onChange={(e) => setTransactionData({ ...transactionData, payMethod: e.target.value as Deposit['payMethod'] })}
            options={[
              { value: '', label: '请选择支付方式' },
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
            placeholder="选填"
            value={transactionData.transactionNo}
            onChange={(e) => setTransactionData({ ...transactionData, transactionNo: e.target.value })}
          />
          <Textarea
            label="备注"
            placeholder="选填"
            value={transactionData.remark}
            onChange={(e) => setTransactionData({ ...transactionData, remark: e.target.value })}
            rows={3}
          />
        </div>
      </Modal>
    </div>
  )
}
