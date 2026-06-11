import { useEffect, useMemo, useState } from 'react'
import { Card, Input, Select, Button, Badge, Table, Modal, StatsCard, Textarea } from '../components/UI'
import { useDormitoryStore } from '../store/dormitory'
import { RoomStatusLabel } from '../types'
import type { UtilityReading, Building, Room } from '../types'
import {
  Gauge,
  Plus,
  Edit2,
  Trash2,
  Settings,
  Filter,
  Download,
  Zap,
  Droplets,
  RotateCcw,
} from 'lucide-react'
import { formatDate } from '../lib/utils'

export default function UtilityReadingPage() {
  const {
    utilityReadings,
    utilityPrice,
    buildings,
    rooms,
    loading,
    fetchUtilityReadings,
    fetchLastUtilityReading,
    addUtilityReading,
    updateUtilityReading,
    removeUtilityReading,
    fetchUtilityPrice,
    updateUtilityPrice,
    fetchBuildings,
    fetchRooms,
  } = useDormitoryStore()

  const [buildingId, setBuildingId] = useState('')
  const [roomId, setRoomId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [priceModalOpen, setPriceModalOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<UtilityReading | null>(null)

  const [formData, setFormData] = useState<Partial<UtilityReading>>({})
  const [formBuildingId, setFormBuildingId] = useState('')
  const [formRoomId, setFormRoomId] = useState('')
  const [formRooms, setFormRooms] = useState<Room[]>([])
  const [lastReading, setLastReading] = useState<UtilityReading | null>(null)

  const [priceForm, setPriceForm] = useState({ electricityPrice: 0, waterPrice: 0 })

  useEffect(() => {
    fetchBuildings()
    fetchUtilityPrice()
    fetchData()
  }, [])

  useEffect(() => {
    if (buildingId) {
      fetchRooms({ buildingId })
    } else {
      fetchRooms()
    }
  }, [buildingId])

  useEffect(() => {
    if (formBuildingId) {
      fetchFormRooms(formBuildingId)
    } else {
      setFormRooms([])
      setFormRoomId('')
    }
  }, [formBuildingId])

  useEffect(() => {
    if (formRoomId) {
      loadLastReading(formRoomId)
    } else {
      setLastReading(null)
    }
  }, [formRoomId])

  const fetchFormRooms = async (bldId: string) => {
    try {
      await fetchRooms({ buildingId: bldId })
      setFormRooms(useDormitoryStore.getState().rooms)
    } catch (e) {
      console.error(e)
    }
  }

  const loadLastReading = async (rmId: string) => {
    try {
      const data = await fetchLastUtilityReading(rmId)
      setLastReading(data)
      if (data && !editModalOpen) {
        setFormData((prev) => ({
          ...prev,
          lastElectricityReading: data.electricityReading,
          lastWaterReading: data.waterReading,
        }))
      }
    } catch (e) {
      console.error(e)
    }
  }

  const fetchData = () => {
    const params: Record<string, string | number> = {}
    if (buildingId) params.buildingId = buildingId
    if (roomId) params.roomId = roomId
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate
    fetchUtilityReadings(params)
  }

  const stats = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const monthReadings = utilityReadings.filter((r) => {
      const d = new Date(r.readingDate)
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear
    })

    return {
      totalReadings: utilityReadings.length,
      monthElectricity: monthReadings.reduce((sum, r) => sum + (r.electricityUsage || 0), 0),
      monthWater: monthReadings.reduce((sum, r) => sum + (r.waterUsage || 0), 0),
    }
  }, [utilityReadings])

  const filteredRooms = useMemo(() => {
    if (!buildingId) return rooms
    return rooms.filter((r) => r.buildingId === buildingId)
  }, [rooms, buildingId])

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return utilityReadings.slice(start, start + pageSize)
  }, [utilityReadings, currentPage])

  const totalPages = Math.ceil(utilityReadings.length / pageSize)

  const handleSearch = () => {
    setCurrentPage(1)
    fetchData()
  }

  const handleReset = () => {
    setBuildingId('')
    setRoomId('')
    setStartDate('')
    setEndDate('')
    setCurrentPage(1)
    fetchUtilityReadings()
  }

  const handleCreate = () => {
    setFormData({
      readingDate: new Date().toISOString().split('T')[0],
      electricityReading: 0,
      waterReading: 0,
      lastElectricityReading: 0,
      lastWaterReading: 0,
      electricityUsage: 0,
      waterUsage: 0,
      operator: '',
      remark: '',
    })
    setFormBuildingId('')
    setFormRoomId('')
    setFormRooms([])
    setLastReading(null)
    setCreateModalOpen(true)
  }

  const handleEdit = (record: UtilityReading) => {
    setSelectedRecord(record)
    setFormData({
      ...record,
    })
    setFormBuildingId(record.buildingId)
    setFormRoomId(record.roomId)
    setLastReading(null)
    setEditModalOpen(true)
  }

  const handleDelete = async (record: UtilityReading) => {
    if (!confirm(`确定要删除 ${record.buildingName} ${record.roomNumber} 的抄表记录吗？`)) return
    try {
      await removeUtilityReading(record.id)
    } catch (e: any) {
      alert(e.message)
    }
  }

  const handleRoomChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRoomId = e.target.value
    setFormRoomId(newRoomId)
    if (newRoomId && lastReading) {
      setFormData((prev) => ({
        ...prev,
        lastElectricityReading: lastReading.electricityReading,
        lastWaterReading: lastReading.waterReading,
      }))
    }
  }

  const handleReadingChange = (field: 'electricityReading' | 'waterReading', value: number) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value }
      const lastElec = newData.lastElectricityReading || 0
      const lastWater = newData.lastWaterReading || 0
      const currElec = newData.electricityReading || 0
      const currWater = newData.waterReading || 0
      newData.electricityUsage = Math.max(0, currElec - lastElec)
      newData.waterUsage = Math.max(0, currWater - lastWater)
      return newData
    })
  }

  const validateForm = (): boolean => {
    if (!formBuildingId) {
      alert('请选择楼栋')
      return false
    }
    if (!formRoomId) {
      alert('请选择房间')
      return false
    }
    if (!formData.readingDate) {
      alert('请选择抄表日期')
      return false
    }
    if (formData.electricityReading === undefined || formData.electricityReading < 0) {
      alert('请输入有效的电表读数')
      return false
    }
    if (formData.waterReading === undefined || formData.waterReading < 0) {
      alert('请输入有效的水表读数')
      return false
    }
    if (!formData.operator?.trim()) {
      alert('请填写抄表人')
      return false
    }
    const building = buildings.find((b) => b.id === formBuildingId)
    const room = formRooms.find((r) => r.id === formRoomId)
    if (!building || !room) {
      alert('无效的楼栋或房间')
      return false
    }
    return true
  }

  const handleSubmitCreate = async () => {
    if (!validateForm()) return

    const building = buildings.find((b) => b.id === formBuildingId)!
    const room = formRooms.find((r) => r.id === formRoomId)!

    try {
      await addUtilityReading({
        ...formData,
        roomId: formRoomId,
        roomNumber: room.roomNumber,
        buildingId: formBuildingId,
        buildingName: building.name,
      })
      setCreateModalOpen(false)
    } catch (e: any) {
      alert(e.message)
    }
  }

  const handleSubmitEdit = async () => {
    if (!selectedRecord || !validateForm()) return

    const building = buildings.find((b) => b.id === formBuildingId)!
    const room = formRooms.find((r) => r.id === formRoomId)!

    try {
      await updateUtilityReading(selectedRecord.id, {
        ...formData,
        roomId: formRoomId,
        roomNumber: room.roomNumber,
        buildingId: formBuildingId,
        buildingName: building.name,
      })
      setEditModalOpen(false)
    } catch (e: any) {
      alert(e.message)
    }
  }

  const handleOpenPriceModal = () => {
    if (utilityPrice) {
      setPriceForm({
        electricityPrice: utilityPrice.electricityPrice,
        waterPrice: utilityPrice.waterPrice,
      })
    }
    setPriceModalOpen(true)
  }

  const handleSubmitPrice = async () => {
    if (priceForm.electricityPrice <= 0) {
      alert('请输入有效的电价')
      return
    }
    if (priceForm.waterPrice <= 0) {
      alert('请输入有效的水价')
      return
    }
    try {
      await updateUtilityPrice(priceForm)
      setPriceModalOpen(false)
    } catch (e: any) {
      alert(e.message)
    }
  }

  const handleExport = () => {
    const headers = [
      '抄表日期',
      '楼栋',
      '房间',
      '上次电表读数',
      '本次电表读数',
      '电用量',
      '上次水表读数',
      '本次水表读数',
      '水用量',
      '抄表人',
      '备注',
    ]
    const rows = utilityReadings.map((r) => [
      formatDate(r.readingDate),
      r.buildingName,
      r.roomNumber,
      r.lastElectricityReading,
      r.electricityReading,
      r.electricityUsage,
      r.lastWaterReading,
      r.waterReading,
      r.waterUsage,
      r.operator,
      r.remark || '',
    ])

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `水电抄表记录_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const columns = [
    {
      key: 'readingDate',
      label: '抄表日期',
      width: '120px',
      render: (row: UtilityReading) => (
        <span className="text-slate-600">{formatDate(row.readingDate)}</span>
      ),
    },
    {
      key: 'buildingName',
      label: '楼栋',
      width: '100px',
    },
    {
      key: 'roomNumber',
      label: '房间',
      width: '80px',
    },
    {
      key: 'electricity',
      label: '电表读数',
      width: '280px',
      render: (row: UtilityReading) => (
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center">
            <span className="text-xs text-slate-400">上次</span>
            <span className="text-sm font-medium text-slate-700">{row.lastElectricityReading}</span>
          </div>
          <span className="text-slate-300">→</span>
          <div className="flex flex-col items-center">
            <span className="text-xs text-slate-400">本次</span>
            <span className="text-sm font-semibold text-slate-800">{row.electricityReading}</span>
          </div>
          <Badge variant="warning" className="ml-2">
            <Zap className="h-3 w-3 mr-1" />
            {row.electricityUsage} 度
          </Badge>
        </div>
      ),
    },
    {
      key: 'water',
      label: '水表读数',
      width: '280px',
      render: (row: UtilityReading) => (
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center">
            <span className="text-xs text-slate-400">上次</span>
            <span className="text-sm font-medium text-slate-700">{row.lastWaterReading}</span>
          </div>
          <span className="text-slate-300">→</span>
          <div className="flex flex-col items-center">
            <span className="text-xs text-slate-400">本次</span>
            <span className="text-sm font-semibold text-slate-800">{row.waterReading}</span>
          </div>
          <Badge variant="info" className="ml-2">
            <Droplets className="h-3 w-3 mr-1" />
            {row.waterUsage} 吨
          </Badge>
        </div>
      ),
    },
    {
      key: 'operator',
      label: '抄表人',
      width: '100px',
    },
    {
      key: 'actions',
      label: '操作',
      width: '140px',
      render: (row: UtilityReading) => (
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
        <span className="text-sm text-slate-500">
          共 {utilityReadings.length} 条记录，第 {currentPage}/{totalPages} 页
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
    )
  }

  const renderForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="楼栋"
          value={formBuildingId}
          onChange={(e) => {
            setFormBuildingId(e.target.value)
            setFormRoomId('')
            setLastReading(null)
          }}
          options={[
            { value: '', label: '请选择楼栋' },
            ...buildings.map((b) => ({ value: b.id, label: b.name })),
          ]}
        />
        <Select
          label="房间"
          value={formRoomId}
          onChange={handleRoomChange}
          options={[
            { value: '', label: '请选择房间' },
            ...formRooms.map((r) => ({
              value: r.id,
              label: `${r.roomNumber} (${RoomStatusLabel[r.status]})`,
            })),
          ]}
        />
      </div>

      {lastReading && !editModalOpen && (
        <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
          <p className="font-medium mb-1">该房间最近一次抄表记录：</p>
          <p>
            抄表日期：{formatDate(lastReading.readingDate)}，电表读数：
            {lastReading.electricityReading}，水表读数：{lastReading.waterReading}
          </p>
        </div>
      )}

      <Input
        label="抄表日期"
        type="date"
        value={formData.readingDate || ''}
        onChange={(e) => setFormData({ ...formData, readingDate: e.target.value })}
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">上次电表读数（度）</label>
          <input
            type="number"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-sm text-slate-600"
            value={formData.lastElectricityReading || 0}
            disabled
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">上次水表读数（吨）</label>
          <input
            type="number"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-sm text-slate-600"
            value={formData.lastWaterReading || 0}
            disabled
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="本次电表读数（度）"
          type="number"
          min="0"
          value={formData.electricityReading || ''}
          onChange={(e) => handleReadingChange('electricityReading', Number(e.target.value))}
        />
        <Input
          label="本次水表读数（吨）"
          type="number"
          min="0"
          value={formData.waterReading || ''}
          onChange={(e) => handleReadingChange('waterReading', Number(e.target.value))}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-orange-50 rounded-lg p-3">
          <p className="text-sm text-orange-600 mb-1">电用量</p>
          <p className="text-xl font-bold text-orange-700 flex items-center gap-2">
            <Zap className="h-5 w-5" />
            {formData.electricityUsage || 0} 度
          </p>
        </div>
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-sm text-blue-600 mb-1">水用量</p>
          <p className="text-xl font-bold text-blue-700 flex items-center gap-2">
            <Droplets className="h-5 w-5" />
            {formData.waterUsage || 0} 吨
          </p>
        </div>
      </div>

      <Input
        label="抄表人"
        placeholder="请输入抄表人姓名"
        value={formData.operator || ''}
        onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
      />

      <Textarea
        label="备注"
        placeholder="补充说明（可选）"
        rows={2}
        value={formData.remark || ''}
        onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
      />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatsCard
          title="累计抄表次数"
          value={stats.totalReadings}
          icon={<Gauge className="h-6 w-6" />}
          color="orange"
        />
        <StatsCard
          title="本月用电量"
          value={`${stats.monthElectricity} 度`}
          icon={<Zap className="h-6 w-6" />}
          color="purple"
        />
        <StatsCard
          title="本月用水量"
          value={`${stats.monthWater} 吨`}
          icon={<Droplets className="h-6 w-6" />}
          color="blue"
        />
      </div>

      <Card>
        <div className="flex flex-wrap gap-4 items-end">
          <Select
            label="楼栋"
            value={buildingId}
            onChange={(e) => {
              setBuildingId(e.target.value)
              setRoomId('')
            }}
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
              ...filteredRooms.map((r) => ({ value: r.id, label: r.roomNumber })),
            ]}
            className="w-40"
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
              <RotateCcw className="h-4 w-4" />
              重置
            </Button>
          </div>
        </div>
      </Card>

      <Card
        title={`水电抄表记录 (共 ${utilityReadings.length} 条)`}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleOpenPriceModal}>
              <Settings className="h-4 w-4" />
              单价设置
            </Button>
            <Button variant="secondary" onClick={handleExport}>
              <Download className="h-4 w-4" />
              导出
            </Button>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4" />
              新增抄表
            </Button>
          </div>
        }
      >
        <Table
          columns={columns}
          data={paginatedData}
          emptyText="暂无抄表记录"
        />
        {renderPagination()}
      </Card>

      <Modal
        open={createModalOpen}
        title="新增抄表记录"
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
        {renderForm()}
      </Modal>

      <Modal
        open={editModalOpen}
        title="编辑抄表记录"
        onClose={() => setEditModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmitEdit}>保存</Button>
          </>
        }
      >
        {renderForm()}
      </Modal>

      <Modal
        open={priceModalOpen}
        title="水电单价设置"
        onClose={() => setPriceModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPriceModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmitPrice}>保存</Button>
          </>
        }
      >
        <div className="space-y-4">
          {utilityPrice && (
            <div className="text-sm text-slate-500 mb-4">
              上次更新时间：{formatDate(utilityPrice.updatedAt)}
            </div>
          )}
          <Input
            label="电价（元/度）"
            type="number"
            step="0.01"
            min="0"
            value={priceForm.electricityPrice || ''}
            onChange={(e) => setPriceForm({ ...priceForm, electricityPrice: Number(e.target.value) })}
          />
          <Input
            label="水价（元/吨）"
            type="number"
            step="0.01"
            min="0"
            value={priceForm.waterPrice || ''}
            onChange={(e) => setPriceForm({ ...priceForm, waterPrice: Number(e.target.value) })}
          />
        </div>
      </Modal>
    </div>
  )
}
