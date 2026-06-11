import { useEffect, useMemo, useState } from 'react'
import { Card, Input, Select, Button, Badge, Table, Modal, StatsCard } from '../components/UI'
import { api } from '../lib/api'
import { DeviceCategoryLabel, DeviceStatusLabel } from '../types'
import type { Device, DeviceCategory, DeviceStatus, Building, Room } from '../types'
import { Search, Plus, Edit, Trash2, RotateCcw, Wrench, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'

export default function Devices() {
  const [devices, setDevices] = useState<Device[]>([])
  const [buildings, setBuildings] = useState<Building[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const [buildingId, setBuildingId] = useState('')
  const [roomId, setRoomId] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const [keyword, setKeyword] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingDevice, setEditingDevice] = useState<Device | null>(null)
  const [formData, setFormData] = useState<Partial<Device>>({})

  useEffect(() => {
    fetchData()
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
      if (buildingId) params.buildingId = buildingId
      if (roomId) params.roomId = roomId
      if (category) params.category = category
      if (status) params.status = status
      const data = await api.getDevices(params)
      setDevices(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
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
      const data = await api.getDeviceStats()
      setStats(data)
    } catch (e) {
      console.error(e)
    }
  }

  const filteredDevices = useMemo(() => {
    let list = [...devices]
    if (keyword.trim()) {
      const kw = keyword.trim().toLowerCase()
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(kw) ||
          d.code.toLowerCase().includes(kw) ||
          d.brand?.toLowerCase().includes(kw) ||
          d.roomNumber?.toLowerCase().includes(kw),
      )
    }
    return list
  }, [devices, keyword])

  const handleSearch = () => {
    fetchData()
  }

  const handleReset = () => {
    setBuildingId('')
    setRoomId('')
    setCategory('')
    setStatus('')
    setKeyword('')
  }

  const handleAdd = () => {
    setEditingDevice(null)
    setFormData({
      name: '',
      code: '',
      category: 'other' as DeviceCategory,
      brand: '',
      model: '',
      status: 'normal' as DeviceStatus,
      remark: '',
    })
    setModalOpen(true)
  }

  const handleEdit = (device: Device) => {
    setEditingDevice(device)
    setFormData({ ...device })
    setModalOpen(true)
  }

  const handleDelete = async (device: Device) => {
    if (!confirm(`确定要删除设备 "${device.name}" 吗？`)) return
    try {
      await api.deleteDevice(device.id)
      fetchData()
      fetchStats()
    } catch (e: any) {
      alert(e.message)
    }
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.code) {
      alert('请填写设备名称和编号')
      return
    }
    try {
      if (editingDevice) {
        await api.updateDevice(editingDevice.id, formData)
      } else {
        await api.createDevice(formData)
      }
      setModalOpen(false)
      fetchData()
      fetchStats()
    } catch (e: any) {
      alert(e.message)
    }
  }

  const getStatusBadge = (deviceStatus: DeviceStatus) => {
    switch (deviceStatus) {
      case 'normal':
        return <Badge variant="success">{DeviceStatusLabel[deviceStatus]}</Badge>
      case 'maintenance':
        return <Badge variant="warning">{DeviceStatusLabel[deviceStatus]}</Badge>
      case 'broken':
        return <Badge variant="danger">{DeviceStatusLabel[deviceStatus]}</Badge>
      case 'scrapped':
        return <Badge variant="default">{DeviceStatusLabel[deviceStatus]}</Badge>
      default:
        return <Badge>{deviceStatus}</Badge>
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  }

  const columns = [
    {
      key: 'code',
      label: '设备编号',
      width: '120px',
    },
    {
      key: 'name',
      label: '设备名称',
      width: '120px',
    },
    {
      key: 'category',
      label: '设备类型',
      width: '100px',
      render: (row: Device) => (
        <span className="text-slate-600">{DeviceCategoryLabel[row.category]}</span>
      ),
    },
    {
      key: 'brand',
      label: '品牌',
      width: '100px',
      render: (row: Device) => <span className="text-slate-600">{row.brand || '-'}</span>,
    },
    {
      key: 'buildingName',
      label: '所属楼栋',
      width: '100px',
      render: (row: Device) => <span className="text-slate-600">{row.buildingName || '-'}</span>,
    },
    {
      key: 'roomNumber',
      label: '房间号',
      width: '100px',
      render: (row: Device) => <span className="text-slate-600">{row.roomNumber || '-'}</span>,
    },
    {
      key: 'status',
      label: '状态',
      width: '100px',
      render: (row: Device) => getStatusBadge(row.status),
    },
    {
      key: 'installDate',
      label: '安装日期',
      width: '120px',
      render: (row: Device) => <span className="text-slate-600">{formatDate(row.installDate)}</span>,
    },
    {
      key: 'lastMaintenanceDate',
      label: '上次维护',
      width: '120px',
      render: (row: Device) => (
        <span className="text-slate-600">{formatDate(row.lastMaintenanceDate)}</span>
      ),
    },
    {
      key: 'actions',
      label: '操作',
      width: '140px',
      render: (row: Device) => (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => handleEdit(row)}>
            <Edit className="h-4 w-4" />
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
          title="设备总数"
          value={stats?.total || 0}
          icon={<Wrench className="h-6 w-6" />}
          color="orange"
        />
        <StatsCard
          title="正常运行"
          value={stats?.normal || 0}
          icon={<CheckCircle className="h-6 w-6" />}
          color="green"
        />
        <StatsCard
          title="维护中"
          value={stats?.maintenance || 0}
          icon={<AlertTriangle className="h-6 w-6" />}
          color="blue"
        />
        <StatsCard
          title="故障/报废"
          value={(stats?.broken || 0) + (stats?.scrapped || 0)}
          icon={<XCircle className="h-6 w-6" />}
          color="purple"
        />
      </div>

      <Card>
        <div className="flex flex-wrap gap-4 items-end">
          <Select
            label="所属楼栋"
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
          <Select
            label="设备类型"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={[
              { value: '', label: '全部类型' },
              { value: 'air_conditioner', label: '空调' },
              { value: 'water_heater', label: '热水器' },
              { value: 'lamp', label: '灯具' },
              { value: 'bed', label: '床铺' },
              { value: 'lock', label: '门锁' },
              { value: 'desk', label: '书桌' },
              { value: 'wardrobe', label: '衣柜' },
              { value: 'other', label: '其他' },
            ]}
            className="w-36"
          />
          <Select
            label="设备状态"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: '', label: '全部状态' },
              { value: 'normal', label: '正常' },
              { value: 'maintenance', label: '维护中' },
              { value: 'broken', label: '故障' },
              { value: 'scrapped', label: '已报废' },
            ]}
            className="w-36"
          />
          <Input
            label="关键词"
            placeholder="设备名称/编号/品牌"
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
        title={`设备列表 (共 ${filteredDevices.length} 条)`}
        actions={
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4" />
            添加设备
          </Button>
        }
      >
        <Table columns={columns} data={filteredDevices} emptyText="暂无设备数据" />
      </Card>

      <Modal
        open={modalOpen}
        title={editingDevice ? '编辑设备' : '添加设备'}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit}>确定</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="设备名称"
              placeholder="请输入设备名称"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Input
              label="设备编号"
              placeholder="请输入设备编号"
              value={formData.code || ''}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="设备类型"
              value={formData.category || ''}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value as DeviceCategory })
              }
              options={[
                { value: 'air_conditioner', label: '空调' },
                { value: 'water_heater', label: '热水器' },
                { value: 'lamp', label: '灯具' },
                { value: 'bed', label: '床铺' },
                { value: 'lock', label: '门锁' },
                { value: 'desk', label: '书桌' },
                { value: 'wardrobe', label: '衣柜' },
                { value: 'other', label: '其他' },
              ]}
            />
            <Select
              label="设备状态"
              value={formData.status || ''}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as DeviceStatus })
              }
              options={[
                { value: 'normal', label: '正常' },
                { value: 'maintenance', label: '维护中' },
                { value: 'broken', label: '故障' },
                { value: 'scrapped', label: '已报废' },
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="品牌"
              placeholder="请输入品牌"
              value={formData.brand || ''}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            />
            <Input
              label="型号"
              placeholder="请输入型号"
              value={formData.model || ''}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="所属楼栋"
              value={formData.buildingId || ''}
              onChange={(e) => {
                setFormData({ ...formData, buildingId: e.target.value, roomId: '' })
              }}
              options={[
                { value: '', label: '请选择楼栋' },
                ...buildings.map((b) => ({ value: b.id, label: b.name })),
              ]}
            />
            <Select
              label="房间"
              value={formData.roomId || ''}
              onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
              options={[
                { value: '', label: '请选择房间' },
                ...(formData.buildingId
                  ? rooms.filter((r) => r.buildingId === formData.buildingId)
                  : []
                ).map((r) => ({ value: r.id, label: r.roomNumber })),
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="安装日期"
              type="date"
              value={formData.installDate ? formData.installDate.split('T')[0] : ''}
              onChange={(e) => setFormData({ ...formData, installDate: e.target.value })}
            />
            <Input
              label="上次维护日期"
              type="date"
              value={formData.lastMaintenanceDate ? formData.lastMaintenanceDate.split('T')[0] : ''}
              onChange={(e) =>
                setFormData({ ...formData, lastMaintenanceDate: e.target.value })
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">备注</label>
            <textarea
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-y"
              rows={3}
              placeholder="请输入备注信息"
              value={formData.remark || ''}
              onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
