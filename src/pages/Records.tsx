import { useEffect, useMemo, useState } from 'react'
import { Card, Input, Select, Button, Badge, Table } from '../components/UI'
import { useDormitoryStore } from '../store/dormitory'
import { RecordTypeLabel } from '../types'
import type { DormitoryRecord } from '../types'
import { Search, RotateCcw } from 'lucide-react'

export default function Records() {
  const { fetchRecords, records, loading } = useDormitoryStore()

  const [type, setType] = useState<string>('')
  const [workerName, setWorkerName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  const filteredRecords = useMemo(() => {
    let list = [...records]

    if (type) {
      list = list.filter((r) => r.type === type)
    }
    if (workerName.trim()) {
      list = list.filter((r) => r.workerName.includes(workerName.trim()))
    }
    if (startDate) {
      list = list.filter((r) => r.operatedAt >= startDate)
    }
    if (endDate) {
      list = list.filter((r) => r.operatedAt <= endDate + ' 23:59:59')
    }

    list.sort((a, b) => new Date(b.operatedAt).getTime() - new Date(a.operatedAt).getTime())

    return list
  }, [records, type, workerName, startDate, endDate])

  const handleReset = () => {
    setType('')
    setWorkerName('')
    setStartDate('')
    setEndDate('')
  }

  const getBadgeVariant = (recordType: DormitoryRecord['type']) => {
    switch (recordType) {
      case 'checkin':
        return 'success'
      case 'checkout':
        return 'danger'
      case 'transfer':
        return 'info'
      default:
        return 'default'
    }
  }

  const formatBed = (roomNumber?: string, bedId?: string) => {
    if (!roomNumber && !bedId) return '-'
    const bedNum = bedId ? bedId.split('-').pop() : ''
    return `${roomNumber || ''}${bedNum ? ' 床位' + bedNum : ''}` || '-'
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const columns = [
    {
      key: 'operatedAt',
      label: '操作时间',
      width: '180px',
      render: (row: DormitoryRecord) => (
        <span className="text-slate-600">{formatDate(row.operatedAt)}</span>
      ),
    },
    {
      key: 'type',
      label: '类型',
      width: '100px',
      render: (row: DormitoryRecord) => (
        <Badge variant={getBadgeVariant(row.type)}>{RecordTypeLabel[row.type]}</Badge>
      ),
    },
    {
      key: 'workerName',
      label: '工人姓名',
      width: '120px',
    },
    {
      key: 'from',
      label: '原房间/床位',
      width: '140px',
      render: (row: DormitoryRecord) => {
        if (row.type === 'checkin') return '-'
        return formatBed(row.fromRoomNumber, row.fromBedId)
      },
    },
    {
      key: 'to',
      label: '目标房间/床位',
      width: '140px',
      render: (row: DormitoryRecord) => {
        if (row.type === 'checkout') return '-'
        return formatBed(row.toRoomNumber || row.roomNumber, row.toBedId || row.bedId)
      },
    },
    {
      key: 'reason',
      label: '原因',
      render: (row: DormitoryRecord) => <span className="text-slate-600">{row.reason || '-'}</span>,
    },
    {
      key: 'operator',
      label: '操作人',
      width: '120px',
      render: (row: DormitoryRecord) => <span className="text-slate-600">{row.operator}</span>,
    },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap gap-4 items-end">
          <Select
            label="类型"
            value={type}
            onChange={(e) => setType(e.target.value)}
            options={[
              { value: '', label: '全部' },
              { value: 'checkin', label: '入住' },
              { value: 'checkout', label: '退宿' },
              { value: 'transfer', label: '调房' },
            ]}
            className="w-40"
          />
          <Input
            label="工人姓名"
            placeholder="请输入工人姓名"
            value={workerName}
            onChange={(e) => setWorkerName(e.target.value)}
            className="w-48"
          />
          <Input
            label="开始日期"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-44"
          />
          <Input
            label="结束日期"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-44"
          />
          <div className="flex gap-2">
            <Button>
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

      <Card title={`异动记录 (共 ${filteredRecords.length} 条)`}>
        <Table columns={columns} data={filteredRecords} emptyText="暂无异动记录" />
      </Card>
    </div>
  )
}
