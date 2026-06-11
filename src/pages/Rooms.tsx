import { useEffect, useMemo, useState } from 'react'
import { Card, Button, Table, Modal, Input, Select, Badge } from '../components/UI'
import { useDormitoryStore } from '../store/dormitory'
import {
  Building,
  Room,
  Bed,
  RoomGenderLabel,
  WorkerGenderLabel,
  RoomTypeLabel,
  RoomStatusLabel,
  BedStatusLabel,
} from '../types'
import { Plus, Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

export default function Rooms() {
  const {
    buildings,
    rooms,
    beds,
    fetchBuildings,
    fetchRooms,
    fetchBeds,
    addRoom,
    updateRoom,
    removeRoom,
  } = useDormitoryStore()

  const [filterBuilding, setFilterBuilding] = useState('')
  const [filterFloor, setFilterFloor] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [expandedRoomId, setExpandedRoomId] = useState<string | null>(null)

  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)

  const [formData, setFormData] = useState({
    roomNumber: '',
    buildingId: '',
    floor: 1,
    gender: 'male' as Room['gender'],
    roomType: 'standard' as Room['roomType'],
    bedCount: 5,
    status: 'normal' as Room['status'],
    remark: '',
  })

  useEffect(() => {
    fetchBuildings()
    fetchRooms()
    fetchBeds()
  }, [fetchBuildings, fetchRooms, fetchBeds])

  const floors = useMemo(() => {
    const set = new Set<number>()
    rooms
      .filter((r: any) => !filterBuilding || r.buildingId === filterBuilding)
      .forEach((r: any) => set.add(r.floor))
    return Array.from(set).sort((a, b) => a - b)
  }, [rooms, filterBuilding])

  const filteredRooms = useMemo(() => {
    return rooms.filter((r: any) => {
      if (filterBuilding && r.buildingId !== filterBuilding) return false
      if (filterFloor && r.floor !== Number(filterFloor)) return false
      if (filterStatus && r.status !== filterStatus) return false
      return true
    })
  }, [rooms, filterBuilding, filterFloor, filterStatus])

  const getRoomBeds = (roomId: string) => {
    return beds.filter((b: any) => b.roomId === roomId)
  }

  const getRoomOccupancy = (roomId: string) => {
    const roomBeds = getRoomBeds(roomId)
    const occupied = roomBeds.filter((b: any) => b.status === 'occupied').length
    return { occupied, total: roomBeds.length }
  }

  const getBuildingName = (buildingId: string) => {
    const b = buildings.find((x) => x.id === buildingId)
    return b ? b.name : '-'
  }

  const getStatusBadgeVariant = (status: Room['status']) => {
    switch (status) {
      case 'normal':
        return 'success'
      case 'maintenance':
        return 'danger'
      case 'cleaning':
        return 'warning'
      default:
        return 'default'
    }
  }

  const getBedStatusBadgeVariant = (status: Bed['status']) => {
    switch (status) {
      case 'available':
        return 'success'
      case 'occupied':
        return 'info'
      case 'maintenance':
        return 'danger'
      default:
        return 'default'
    }
  }

  const resetForm = () => {
    setFormData({
      roomNumber: '',
      buildingId: '',
      floor: 1,
      gender: 'male',
      roomType: 'standard',
      bedCount: 5,
      status: 'normal',
      remark: '',
    })
  }

  const handleAdd = async () => {
    if (!formData.roomNumber.trim() || !formData.buildingId) {
      alert('请填写房间号并选择楼栋')
      return
    }
    await addRoom(formData)
    setAddModalOpen(false)
    resetForm()
  }

  const handleEdit = async () => {
    if (!selectedRoom) return
    await updateRoom(selectedRoom.id, {
      gender: formData.gender,
      status: formData.status,
      remark: formData.remark,
    })
    setEditModalOpen(false)
    setSelectedRoom(null)
    resetForm()
  }

  const handleDelete = async () => {
    if (!selectedRoom) return
    try {
      await removeRoom(selectedRoom.id)
      setDeleteModalOpen(false)
      setSelectedRoom(null)
    } catch (e: any) {
      alert(e.message)
    }
  }

  const openEditModal = (room: Room) => {
    setSelectedRoom(room)
    setFormData({
      roomNumber: room.roomNumber,
      buildingId: room.buildingId,
      floor: room.floor,
      gender: room.gender,
      roomType: room.roomType,
      bedCount: room.bedCount,
      status: room.status,
      remark: room.remark || '',
    })
    setEditModalOpen(true)
  }

  const openDeleteModal = (room: Room) => {
    setSelectedRoom(room)
    setDeleteModalOpen(true)
  }

  const columns = [
    {
      key: 'expand',
      label: '',
      width: '40px',
      render: (row: Room) => (
        <button
          onClick={() => setExpandedRoomId(expandedRoomId === row.id ? null : row.id)}
          className="p-1 hover:bg-slate-100 rounded"
        >
          {expandedRoomId === row.id ? (
            <ChevronUp className="h-4 w-4 text-slate-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-500" />
          )}
        </button>
      ),
    },
    { key: 'roomNumber', label: '房间号' },
    {
      key: 'buildingId',
      label: '楼栋',
      render: (row: Room) => getBuildingName(row.buildingId),
    },
    { key: 'floor', label: '楼层', render: (row: Room) => `${row.floor}层` },
    {
      key: 'roomType',
      label: '类型',
      render: (row: Room) => RoomTypeLabel[row.roomType],
    },
    {
      key: 'gender',
      label: '性别',
      render: (row: Room) =>
        row.gender === 'male' ? (
          <Badge variant="info">{RoomGenderLabel[row.gender]}</Badge>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-pink-600 bg-pink-50">
            {RoomGenderLabel[row.gender]}
          </span>
        ),
    },
    { key: 'bedCount', label: '床位数' },
    {
      key: 'status',
      label: '状态',
      render: (row: Room) => (
        <Badge variant={getStatusBadgeVariant(row.status)}>
          {RoomStatusLabel[row.status]}
        </Badge>
      ),
    },
    {
      key: 'occupancy',
      label: '入住情况',
      render: (row: Room) => {
        const { occupied, total } = getRoomOccupancy(row.id)
        return (
          <span className="text-slate-600">
            {occupied}/{total}人
          </span>
        )
      },
    },
    {
      key: 'actions',
      label: '操作',
      width: '160px',
      render: (row: Room) => (
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => openEditModal(row)}>
            <Edit className="h-4 w-4" />
            编辑
          </Button>
          <Button size="sm" variant="danger" onClick={() => openDeleteModal(row)}>
            <Trash2 className="h-4 w-4" />
            删除
          </Button>
        </div>
      ),
    },
  ]

  const renderAddForm = () => (
    <div className="space-y-4">
      <Select
        label="所属楼栋"
        value={formData.buildingId}
        onChange={(e) => setFormData({ ...formData, buildingId: e.target.value })}
        options={[
          { value: '', label: '请选择楼栋' },
          ...buildings.map((b) => ({ value: b.id, label: b.name })),
        ]}
      />
      <Input
        label="房间号"
        value={formData.roomNumber}
        onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
        placeholder="如：1-101"
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="楼层"
          type="number"
          min={1}
          value={formData.floor}
          onChange={(e) => setFormData({ ...formData, floor: Number(e.target.value) })}
        />
        <Input
          label="床位数"
          type="number"
          min={1}
          max={12}
          value={formData.bedCount}
          onChange={(e) => setFormData({ ...formData, bedCount: Number(e.target.value) })}
        />
      </div>
      <Select
        label="性别"
        value={formData.gender}
        onChange={(e) => setFormData({ ...formData, gender: e.target.value as Room['gender'] })}
        options={[
          { value: 'male', label: '男宿舍' },
          { value: 'female', label: '女宿舍' },
        ]}
      />
      <Select
        label="房间类型"
        value={formData.roomType}
        onChange={(e) => setFormData({ ...formData, roomType: e.target.value as Room['roomType'] })}
        options={[
          { value: 'standard', label: '标准间' },
          { value: 'deluxe', label: '豪华间' },
          { value: 'manager', label: '管理间' },
        ]}
      />
      <Select
        label="房间状态"
        value={formData.status}
        onChange={(e) => setFormData({ ...formData, status: e.target.value as Room['status'] })}
        options={[
          { value: 'normal', label: '正常' },
          { value: 'maintenance', label: '维修中' },
          { value: 'cleaning', label: '清扫中' },
        ]}
      />
      <Input
        label="备注"
        value={formData.remark}
        onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
        placeholder="选填"
      />
    </div>
  )

  const renderEditForm = () => (
    <div className="space-y-4">
      <div className="p-3 bg-slate-50 rounded-lg text-sm">
        <p className="text-slate-600">房间号：{formData.roomNumber}</p>
        <p className="text-slate-600">楼栋：{getBuildingName(formData.buildingId)}</p>
        <p className="text-slate-600">类型：{RoomTypeLabel[formData.roomType]}</p>
        <p className="text-slate-600">床位数：{formData.bedCount}</p>
      </div>
      <Select
        label="性别"
        value={formData.gender}
        onChange={(e) => setFormData({ ...formData, gender: e.target.value as Room['gender'] })}
        options={[
          { value: 'male', label: '男宿舍' },
          { value: 'female', label: '女宿舍' },
        ]}
      />
      <Select
        label="房间状态"
        value={formData.status}
        onChange={(e) => setFormData({ ...formData, status: e.target.value as Room['status'] })}
        options={[
          { value: 'normal', label: '正常' },
          { value: 'maintenance', label: '维修中' },
          { value: 'cleaning', label: '清扫中' },
        ]}
      />
      <Input
        label="备注"
        value={formData.remark}
        onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
        placeholder="选填"
      />
    </div>
  )

  return (
    <div className="space-y-6">
      <Card
        title="房间床位管理"
        actions={
          <Button onClick={() => setAddModalOpen(true)}>
            <Plus className="h-4 w-4" />
            新增房间
          </Button>
        }
      >
        <div className="flex flex-wrap gap-4 mb-6">
          <Select
            label="楼栋"
            value={filterBuilding}
            onChange={(e) => {
              setFilterBuilding(e.target.value)
              setFilterFloor('')
            }}
            options={[
              { value: '', label: '全部楼栋' },
              ...buildings.map((b) => ({ value: b.id, label: b.name })),
            ]}
            className="w-44"
          />
          <Select
            label="楼层"
            value={filterFloor}
            onChange={(e) => setFilterFloor(e.target.value)}
            options={[
              { value: '', label: '全部楼层' },
              ...floors.map((f) => ({ value: String(f), label: `${f}层` })),
            ]}
            className="w-40"
          />
          <Select
            label="状态"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            options={[
              { value: '', label: '全部状态' },
              { value: 'normal', label: '正常' },
              { value: 'maintenance', label: '维修中' },
              { value: 'cleaning', label: '清扫中' },
            ]}
            className="w-40"
          />
        </div>

        {filteredRooms.map((room: any) => (
          <div key={room.id} className="border-b border-slate-100">
            <div className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
              <button
                onClick={() => setExpandedRoomId(expandedRoomId === room.id ? null : room.id)}
                className="p-1 hover:bg-slate-200 rounded flex-shrink-0"
              >
                {expandedRoomId === room.id ? (
                  <ChevronUp className="h-4 w-4 text-slate-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                )}
              </button>
              <span className="font-medium text-slate-800 w-20">{room.roomNumber}</span>
              <span className="text-slate-600 w-24">{getBuildingName(room.buildingId)}</span>
              <span className="text-slate-600 w-16">{room.floor}层</span>
              <span className="text-slate-600 w-20">{RoomTypeLabel[room.roomType]}</span>
              {room.gender === 'male' ? (
                <Badge variant="info">{RoomGenderLabel[room.gender]}</Badge>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-pink-600 bg-pink-50">
                  {RoomGenderLabel[room.gender]}
                </span>
              )}
              <span className="text-slate-600 w-16">{room.bedCount}床</span>
              <Badge variant={getStatusBadgeVariant(room.status)}>
                {RoomStatusLabel[room.status]}
              </Badge>
              <span className="text-slate-600 ml-2">
                {getRoomOccupancy(room.id).occupied}/{getRoomOccupancy(room.id).total}人
              </span>
              <div className="flex-1" />
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => openEditModal(room)}>
                  <Edit className="h-3.5 w-3.5" />
                  编辑
                </Button>
                <Button size="sm" variant="danger" onClick={() => openDeleteModal(room)}>
                  <Trash2 className="h-3.5 w-3.5" />
                  删除
                </Button>
              </div>
            </div>
            {expandedRoomId === room.id && (
              <div className="px-12 pb-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-slate-700 mb-3">床位列表</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {getRoomBeds(room.id).map((bed: any) => (
                      <div key={bed.id} className="bg-white rounded-lg p-3 border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-slate-800">{bed.bedNumber}</span>
                          <Badge variant={getBedStatusBadgeVariant(bed.status)}>
                            {BedStatusLabel[bed.status]}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-500">
                          {bed.workerName || <span className="text-slate-400">空闲</span>}
                        </p>
                        {bed.remark && (
                          <p className="text-xs text-slate-400 mt-1">{bed.remark}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {filteredRooms.length === 0 && (
          <div className="text-center py-16 text-slate-400">暂无房间数据</div>
        )}
      </Card>

      <Modal
        open={addModalOpen}
        title="新增房间"
        onClose={() => {
          setAddModalOpen(false)
          resetForm()
        }}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setAddModalOpen(false)
                resetForm()
              }}
            >
              取消
            </Button>
            <Button onClick={handleAdd}>确认新增</Button>
          </>
        }
      >
        {renderAddForm()}
      </Modal>

      <Modal
        open={editModalOpen}
        title="编辑房间"
        onClose={() => {
          setEditModalOpen(false)
          setSelectedRoom(null)
          resetForm()
        }}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setEditModalOpen(false)
                setSelectedRoom(null)
                resetForm()
              }}
            >
              取消
            </Button>
            <Button onClick={handleEdit}>保存</Button>
          </>
        }
      >
        {renderEditForm()}
      </Modal>

      <Modal
        open={deleteModalOpen}
        title="确认删除"
        onClose={() => {
          setDeleteModalOpen(false)
          setSelectedRoom(null)
        }}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setDeleteModalOpen(false)
                setSelectedRoom(null)
              }}
            >
              取消
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              确认删除
            </Button>
          </>
        }
      >
        <div className="text-slate-600">
          确定要删除房间「{selectedRoom?.roomNumber}」吗？
          <p className="mt-2 text-sm text-red-500">注意：该房间还有入住人员时将无法删除。</p>
        </div>
      </Modal>
    </div>
  )
}
