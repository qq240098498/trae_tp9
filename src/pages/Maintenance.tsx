import { useEffect, useMemo, useState } from 'react'
import { Card, Input, Select, Button, Badge, Table, Modal, StatsCard, Textarea } from '../components/UI'
import { api } from '../lib/api'
import { MaintenanceStatusLabel, MaintenancePriorityLabel, DeviceCategoryLabel } from '../types'
import type { MaintenanceRecord, MaintenanceStatus, MaintenancePriority, Device, Building, Room } from '../types'
import {
  Search,
  Plus,
  Edit,
  Trash2,
  RotateCcw,
  FileText,
  Clock,
  Hammer,
  CheckCircle,
  XCircle,
  Eye,
  AlertTriangle,
} from 'lucide-react'

export default function Maintenance() {
  const [records, setRecords] = useState<MaintenanceRecord[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [buildings, setBuildings] = useState<Building[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [buildingId, setBuildingId] = useState('')
  const [roomId, setRoomId] = useState('')
  const [keyword, setKeyword] = useState('')

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(null)
  const [formData, setFormData] = useState<Partial<MaintenanceRecord>>({})

  useEffect(() => {
    fetchData()
    fetchDevices()
    fetchBuildings()
    fetchStats()
  }, [])

  useEffect(() => {
    if (buildingId) {
      fetchRooms(buildingId)
    } else {
      setRooms([])
      setRoomId('')
    }
  }, [buildingId])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (status) params.status = status
      if (priority) params.priority = priority
      if (roomId) params.roomId = roomId
      const data = await api.getMaintenanceRecords(params)
      setRecords(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const fetchDevices = async () => {
    try {
      const data = await api.getDevices()
      setDevices(data)
    } catch (e) {
      console.error(e)
    }
  }

  const fetchBuildings = async () => {
    try {
      const data = await api.getBuildings()
      setBuildings(data)
    } catch (e) {
      console.error(e)
    }
  }

  const fetchRooms = async (bldId: string) => {
    try {
      const data = await api.getRooms({ buildingId: bldId })
      setRooms(data)
    } catch (e) {
      console.error(e)
    }
  }

  const fetchStats = async () => {
    try {
      const data = await api.getMaintenanceStats()
      setStats(data)
    } catch (e) {
      console.error(e)
    }
  }

  const filteredRecords = useMemo(() => {
    let list = [...records]
    if (keyword.trim()) {
      const kw = keyword.trim().toLowerCase()
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(kw) ||
          r.deviceName.toLowerCase().includes(kw) ||
          r.deviceCode.toLowerCase().includes(kw) ||
          r.reporter.toLowerCase().includes(kw) ||
          r.roomNumber?.toLowerCase().includes(kw),
      )
    }
    return list
  }, [records, keyword])

  const handleSearch = () => {
    fetchData()
  }

  const handleReset = () => {
    setStatus('')
    setPriority('')
    setBuildingId('')
    setRoomId('')
    setKeyword('')
  }

  const handleCreate = () => {
    setFormData({
      deviceId: '',
      title: '',
      description: '',
      reporter: '',
      reporterPhone: '',
      priority: 'medium' as MaintenancePriority,
      faultType: '',
      remark: '',
    })
    setCreateModalOpen(true)
  }

  const handleView = (record: MaintenanceRecord) => {
    setSelectedRecord(record)
    setDetailModalOpen(true)
  }

  const handleDelete = async (record: MaintenanceRecord) => {
    if (!confirm(`确定要删除工单 "${record.title}" 吗？`)) return
    try {
      await api.deleteMaintenanceRecord(record.id)
      fetchData()
      fetchStats()
    } catch (e: any) {
      alert(e.message)
    }
  }

  const handleSubmit = async () => {
    if (!formData.deviceId) {
      alert('请选择设备')
      return
    }
    if (!formData.title) {
      alert('请填写问题标题')
      return
    }
    if (!formData.description) {
      alert('请填写问题描述')
      return
    }
    if (!formData.reporter) {
      alert('请填写上报人')
      return
    }
    try {
      await api.createMaintenanceRecord(formData)
      setCreateModalOpen(false)
      fetchData()
      fetchStats()
      fetchDevices()
    } catch (e: any) {
      alert(e.message)
    }
  }

  const handleStatusChange = async (record: MaintenanceRecord, newStatus: MaintenanceStatus) => {
    if (newStatus === 'completed' && !record.solution) {
      alert('请先填写解决方案后再完成工单')
      return
    }
    try {
      await api.updateMaintenanceRecord(record.id, { status: newStatus })
      fetchData()
      fetchStats()
      fetchDevices()
      if (selectedRecord && selectedRecord.id === record.id) {
        const updated = await api.getMaintenanceRecord(record.id)
        setSelectedRecord(updated)
      }
    } catch (e: any) {
      alert(e.message)
    }
  }

  const handleUpdateRecord = async (updates: Partial<MaintenanceRecord>) => {
    if (!selectedRecord) return
    try {
      const updated = await api.updateMaintenanceRecord(selectedRecord.id, updates)
      setSelectedRecord(updated)
      fetchData()
      fetchStats()
      fetchDevices()
    } catch (e: any) {
      alert(e.message)
    }
  }

  const getStatusBadge = (s: MaintenanceStatus) => {
    switch (s) {
      case 'pending':
        return <Badge variant="warning">{MaintenanceStatusLabel[s]}</Badge>
      case 'processing':
        return <Badge variant="info">{MaintenanceStatusLabel[s]}</Badge>
      case 'completed':
        return <Badge variant="success">{MaintenanceStatusLabel[s]}</Badge>
      case 'cancelled':
        return <Badge variant="default">{MaintenanceStatusLabel[s]}</Badge>
      default:
        return <Badge>{s}</Badge>
    }
  }

  const getPriorityBadge = (p: MaintenancePriority) => {
    switch (p) {
      case 'low':
        return <Badge variant="default">{MaintenancePriorityLabel[p]}</Badge>
      case 'medium':
        return <Badge variant="info">{MaintenancePriorityLabel[p]}</Badge>
      case 'high':
        return <Badge variant="warning">{MaintenancePriorityLabel[p]}</Badge>
      case 'urgent':
        return <Badge variant="danger">{MaintenancePriorityLabel[p]}</Badge>
      default:
        return <Badge>{p}</Badge>
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const columns = [
    {
      key: 'reportedAt',
      label: '上报时间',
      width: '160px',
      render: (row: MaintenanceRecord) => (
        <span className="text-slate-600">{formatDate(row.reportedAt)}</span>
      ),
    },
    {
      key: 'title',
      label: '问题标题',
      width: '180px',
    },
    {
      key: 'deviceName',
      label: '设备名称',
      width: '120px',
    },
    {
      key: 'roomNumber',
      label: '房间',
      width: '100px',
      render: (row: MaintenanceRecord) => (
        <span className="text-slate-600">{row.roomNumber || '-'}</span>
      ),
    },
    {
      key: 'buildingName',
      label: '楼栋',
      width: '100px',
      render: (row: MaintenanceRecord) => (
        <span className="text-slate-600">{row.buildingName || '-'}</span>
      ),
    },
    {
      key: 'reporter',
      label: '上报人',
      width: '100px',
    },
    {
      key: 'priority',
      label: '优先级',
      width: '80px',
      render: (row: MaintenanceRecord) => getPriorityBadge(row.priority),
    },
    {
      key: 'status',
      label: '状态',
      width: '100px',
      render: (row: MaintenanceRecord) => getStatusBadge(row.status),
    },
    {
      key: 'assignee',
      label: '处理人',
      width: '100px',
      render: (row: MaintenanceRecord) => (
        <span className="text-slate-600">{row.assignee || '-'}</span>
      ),
    },
    {
      key: 'actions',
      label: '操作',
      width: '160px',
      render: (row: MaintenanceRecord) => (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => handleView(row)}>
            <Eye className="h-4 w-4" />
            详情
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
          title="总工单"
          value={stats?.total || 0}
          icon={<FileText className="h-6 w-6" />}
          color="orange"
        />
        <StatsCard
          title="待处理"
          value={stats?.pending || 0}
          icon={<Clock className="h-6 w-6" />}
          color="blue"
        />
        <StatsCard
          title="处理中"
          value={stats?.processing || 0}
          icon={<Hammer className="h-6 w-6" />}
          color="purple"
        />
        <StatsCard
          title="已完成"
          value={stats?.completed || 0}
          icon={<CheckCircle className="h-6 w-6" />}
          color="green"
        />
      </div>

      <Card>
        <div className="flex flex-wrap gap-4 items-end">
          <Select
            label="工单状态"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: '', label: '全部状态' },
              { value: 'pending', label: '待处理' },
              { value: 'processing', label: '处理中' },
              { value: 'completed', label: '已完成' },
              { value: 'cancelled', label: '已取消' },
            ]}
            className="w-36"
          />
          <Select
            label="优先级"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            options={[
              { value: '', label: '全部优先级' },
              { value: 'low', label: '低' },
              { value: 'medium', label: '中' },
              { value: 'high', label: '高' },
              { value: 'urgent', label: '紧急' },
            ]}
            className="w-36"
          />
          <Select
            label="楼栋"
            value={buildingId}
            onChange={(e) => setBuildingId(e.target.value)}
            options={[
              { value: '', label: '全部楼栋' },
              ...buildings.map((b) => ({ value: b.id, label: b.name })),
            ]}
            className="w-40"
          />
          <Select
            label="房间"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            options={[
              { value: '', label: '全部房间' },
              ...rooms.map((r) => ({ value: r.id, label: r.roomNumber })),
            ]}
            className="w-40"
          />
          <Input
            label="关键词"
            placeholder="标题/设备/上报人"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-48"
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
        title={`维修工单 (共 ${filteredRecords.length} 条)`}
        actions={
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            问题上报
          </Button>
        }
      >
        <Table columns={columns} data={filteredRecords} emptyText="暂无维修工单" />
      </Card>

      <Modal
        open={createModalOpen}
        title="设备问题上报"
        onClose={() => setCreateModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit}>提交</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="所属楼栋"
              value={
                formData.deviceId
                  ? devices.find((d) => d.id === formData.deviceId)?.buildingId || ''
                  : ''
              }
              onChange={(e) => {
                setFormData({ ...formData, deviceId: '' })
              }}
              options={[
                { value: '', label: '请选择楼栋' },
                ...buildings.map((b) => ({ value: b.id, label: b.name })),
              ]}
            />
            <Select
              label="房间"
              value={
                formData.deviceId
                  ? devices.find((d) => d.id === formData.deviceId)?.roomId || ''
                  : ''
              }
              onChange={(e) => {
                setFormData({ ...formData, deviceId: '' })
              }}
              options={[
                { value: '', label: '请选择房间' },
                ...rooms.map((r) => ({ value: r.id, label: r.roomNumber })),
              ]}
            />
          </div>
          <Select
            label="选择设备"
            value={formData.deviceId || ''}
            onChange={(e) => setFormData({ ...formData, deviceId: e.target.value })}
            options={[
              { value: '', label: '请选择设备' },
              ...devices
                .filter(
                  (d) =>
                    !formData.deviceId ||
                    d.id === formData.deviceId,
                )
                .map((d) => ({
                  value: d.id,
                  label: `${d.name} (${d.code}) - ${d.roomNumber || '未分配'}`,
                })),
            ]}
          />
          <Input
            label="问题标题"
            placeholder="请简要描述问题"
            value={formData.title || ''}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">问题描述</label>
            <textarea
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-y"
              rows={4}
              placeholder="请详细描述设备故障情况"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="故障类型"
              value={formData.faultType || ''}
              onChange={(e) => setFormData({ ...formData, faultType: e.target.value })}
              options={[
                { value: '', label: '请选择' },
                { value: '制冷故障', label: '制冷故障' },
                { value: '漏水', label: '漏水' },
                { value: '不亮了', label: '不亮了' },
                { value: '开关损坏', label: '开关损坏' },
                { value: '门锁失灵', label: '门锁失灵' },
                { value: '抽屉损坏', label: '抽屉损坏' },
                { value: '门铰链松动', label: '门铰链松动' },
                { value: '其他', label: '其他' },
              ]}
            />
            <Select
              label="优先级"
              value={formData.priority || 'medium'}
              onChange={(e) =>
                setFormData({ ...formData, priority: e.target.value as MaintenancePriority })
              }
              options={[
                { value: 'low', label: '低' },
                { value: 'medium', label: '中' },
                { value: 'high', label: '高' },
                { value: 'urgent', label: '紧急' },
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="上报人"
              placeholder="请输入上报人姓名"
              value={formData.reporter || ''}
              onChange={(e) => setFormData({ ...formData, reporter: e.target.value })}
            />
            <Input
              label="联系电话"
              placeholder="请输入联系电话"
              value={formData.reporterPhone || ''}
              onChange={(e) => setFormData({ ...formData, reporterPhone: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">备注</label>
            <textarea
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-y"
              rows={2}
              placeholder="补充说明"
              value={formData.remark || ''}
              onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={detailModalOpen}
        title="工单详情"
        onClose={() => setDetailModalOpen(false)}
        footer={
          <>
            {selectedRecord && selectedRecord.status === 'pending' && (
              <Button
                variant="secondary"
                onClick={() => handleStatusChange(selectedRecord, 'processing')}
              >
                开始处理
              </Button>
            )}
            {selectedRecord && selectedRecord.status === 'processing' && (
              <Button
                variant="secondary"
                onClick={() => handleStatusChange(selectedRecord, 'completed')}
              >
                完成工单
              </Button>
            )}
            {(selectedRecord?.status === 'pending' ||
              selectedRecord?.status === 'processing') && (
              <Button
                variant="danger"
                onClick={() => handleStatusChange(selectedRecord!, 'cancelled')}
              >
                取消工单
              </Button>
            )}
            <Button variant="secondary" onClick={() => setDetailModalOpen(false)}>
              关闭
            </Button>
          </>
        }
      >
        {selectedRecord && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-lg text-slate-800">{selectedRecord.title}</h4>
              <div className="flex gap-2">
                {getStatusBadge(selectedRecord.status)}
                {getPriorityBadge(selectedRecord.priority)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">设备编号：</span>
                <span className="text-slate-700">{selectedRecord.deviceCode}</span>
              </div>
              <div>
                <span className="text-slate-500">设备名称：</span>
                <span className="text-slate-700">{selectedRecord.deviceName}</span>
              </div>
              <div>
                <span className="text-slate-500">楼栋：</span>
                <span className="text-slate-700">{selectedRecord.buildingName || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500">房间：</span>
                <span className="text-slate-700">{selectedRecord.roomNumber || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500">故障类型：</span>
                <span className="text-slate-700">{selectedRecord.faultType || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500">处理人：</span>
                <span className="text-slate-700">{selectedRecord.assignee || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500">上报人：</span>
                <span className="text-slate-700">{selectedRecord.reporter}</span>
              </div>
              <div>
                <span className="text-slate-500">联系电话：</span>
                <span className="text-slate-700">{selectedRecord.reporterPhone || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500">上报时间：</span>
                <span className="text-slate-700">{formatDate(selectedRecord.reportedAt)}</span>
              </div>
              <div>
                <span className="text-slate-500">开始处理：</span>
                <span className="text-slate-700">
                  {selectedRecord.startedAt ? formatDate(selectedRecord.startedAt) : '-'}
                </span>
              </div>
              <div>
                <span className="text-slate-500">完成时间：</span>
                <span className="text-slate-700">
                  {selectedRecord.completedAt ? formatDate(selectedRecord.completedAt) : '-'}
                </span>
              </div>
              <div>
                <span className="text-slate-500">维修费用：</span>
                <span className="text-slate-700">
                  {selectedRecord.cost ? `¥${selectedRecord.cost}` : '-'}
                </span>
              </div>
            </div>

            <div>
              <p className="text-sm text-slate-500 mb-2">问题描述：</p>
              <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700">
                {selectedRecord.description}
              </div>
            </div>

            {selectedRecord.solution && (
              <div>
                <p className="text-sm text-slate-500 mb-2">解决方案：</p>
                <div className="bg-green-50 rounded-lg p-3 text-sm text-green-700">
                  {selectedRecord.solution}
                </div>
              </div>
            )}

            {selectedRecord.remark && (
              <div>
                <p className="text-sm text-slate-500 mb-2">备注：</p>
                <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700">
                  {selectedRecord.remark}
                </div>
              </div>
            )}

            {selectedRecord.status === 'processing' && (
              <div className="border-t border-slate-200 pt-4 space-y-3">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                    处理人
                  </label>
                  <input
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    placeholder="请输入处理人姓名"
                    value={selectedRecord.assignee || ''}
                    onChange={(e) =>
                      setSelectedRecord({ ...selectedRecord, assignee: e.target.value })
                    }
                    onBlur={() => handleUpdateRecord({ assignee: selectedRecord.assignee })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                    解决方案
                  </label>
                  <textarea
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-y"
                    rows={3}
                    placeholder="请填写解决方案"
                    value={selectedRecord.solution || ''}
                    onChange={(e) =>
                      setSelectedRecord({ ...selectedRecord, solution: e.target.value })
                    }
                    onBlur={() => handleUpdateRecord({ solution: selectedRecord.solution })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                    维修费用（元）
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    placeholder="请输入维修费用"
                    value={selectedRecord.cost || ''}
                    onChange={(e) =>
                      setSelectedRecord({
                        ...selectedRecord,
                        cost: Number(e.target.value) || 0,
                      })
                    }
                    onBlur={() => handleUpdateRecord({ cost: selectedRecord.cost })}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
