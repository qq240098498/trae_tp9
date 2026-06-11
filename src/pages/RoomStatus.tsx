import { useEffect, useState } from 'react'
import { Card, Button, Select, Modal } from '../components/UI'
import { useDormitoryStore } from '../store/dormitory'
import {
  Building,
  Room,
  Bed,
  Worker,
  RoomTypeLabel,
  RoomStatusLabel,
  BedStatusLabel,
  RoomGenderLabel,
} from '../types'
import { cn } from '../lib/utils'

export default function RoomStatus() {
  const { buildings, rooms, beds, workers, fetchBuildings, fetchRooms, fetchBeds, fetchWorkers } =
    useDormitoryStore()

  const [filterBuilding, setFilterBuilding] = useState('')
  const [filterFloor, setFilterFloor] = useState('')
  const [filterRoomType, setFilterRoomType] = useState('')
  const [filterRoomStatus, setFilterRoomStatus] = useState('')
  const [filterGender, setFilterGender] = useState('')
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)

  useEffect(() => {
    fetchBuildings()
    fetchRooms()
    fetchBeds()
    fetchWorkers()
  }, [fetchBuildings, fetchRooms, fetchBeds, fetchWorkers])

  const floors = Array.from(
    new Set(
      (rooms as Room[])
        .filter((r) => !filterBuilding || r.buildingId === filterBuilding)
        .map((r) => r.floor)
    )
  ).sort((a, b) => a - b)

  const filteredRooms = (rooms as Room[]).filter((r) => {
    if (filterBuilding && r.buildingId !== filterBuilding) return false
    if (filterFloor && r.floor !== Number(filterFloor)) return false
    if (filterRoomType && r.roomType !== filterRoomType) return false
    if (filterRoomStatus && r.status !== filterRoomStatus) return false
    if (filterGender && r.gender !== filterGender) return false
    return true
  })

  const getRoomBeds = (roomId: string) => {
    return (beds as Bed[]).filter((b) => b.roomId === roomId)
  }

  const getRoomOccupancy = (roomId: string) => {
    const roomBeds = getRoomBeds(roomId)
    const occupied = roomBeds.filter((b) => b.status === 'occupied').length
    return { occupied, total: roomBeds.length }
  }

  const getBedWorker = (workerId?: string) => {
    if (!workerId) return null
    return (workers as Worker[]).find((w) => w.id === workerId)
  }

  const getRoomCardBorderClass = (status: Room['status']) => {
    switch (status) {
      case 'maintenance':
        return 'border-red-500 border-2'
      case 'cleaning':
        return 'border-yellow-500 border-2'
      default:
        return 'border-slate-200'
    }
  }

  const getBedCellClass = (status: Bed['status']) => {
    switch (status) {
      case 'available':
        return 'bg-green-500'
      case 'occupied':
        return 'bg-blue-500'
      case 'maintenance':
        return 'bg-slate-400'
    }
  }

  return (
    <div className="space-y-6">
      <Card title="房间状态查询">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Select
            label="楼栋"
            value={filterBuilding}
            onChange={(e) => {
              setFilterBuilding(e.target.value)
              setFilterFloor('')
            }}
            options={[
              { value: '', label: '全部楼栋' },
              ...(buildings as Building[]).map((b) => ({
                value: b.id,
                label: b.name,
              })),
            ]}
          />
          <Select
            label="楼层"
            value={filterFloor}
            onChange={(e) => setFilterFloor(e.target.value)}
            options={[
              { value: '', label: '全部楼层' },
              ...floors.map((f) => ({
                value: String(f),
                label: `${f}层`,
              })),
            ]}
          />
          <Select
            label="房间类型"
            value={filterRoomType}
            onChange={(e) => setFilterRoomType(e.target.value)}
            options={[
              { value: '', label: '全部类型' },
              { value: 'standard', label: '标准间' },
              { value: 'deluxe', label: '豪华间' },
              { value: 'manager', label: '管理间' },
            ]}
          />
          <Select
            label="房间状态"
            value={filterRoomStatus}
            onChange={(e) => setFilterRoomStatus(e.target.value)}
            options={[
              { value: '', label: '全部状态' },
              { value: 'normal', label: '正常' },
              { value: 'maintenance', label: '维修中' },
              { value: 'cleaning', label: '清扫中' },
            ]}
          />
          <Select
            label="宿舍性别"
            value={filterGender}
            onChange={(e) => setFilterGender(e.target.value)}
            options={[
              { value: '', label: '全部' },
              { value: 'male', label: '男宿舍' },
              { value: 'female', label: '女宿舍' },
            ]}
          />
        </div>
      </Card>

      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredRooms.map((room) => {
            const { occupied, total } = getRoomOccupancy(room.id)
            const roomBeds = getRoomBeds(room.id)
            return (
              <div
                key={room.id}
                onClick={() => setSelectedRoom(room)}
                className={cn(
                  'bg-white rounded-lg p-4 cursor-pointer transition-all hover:shadow-md border',
                  getRoomCardBorderClass(room.status)
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-lg text-slate-800">{room.roomNumber}</h4>
                    <p className="text-xs text-slate-500">
                      {RoomGenderLabel[room.gender]} · {RoomTypeLabel[room.roomType]}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-xs font-medium',
                        room.gender === 'male' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
                      )}
                    >
                      {RoomGenderLabel[room.gender]}
                    </span>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-xs font-medium',
                        room.status === 'normal' && 'bg-green-100 text-green-700',
                        room.status === 'maintenance' && 'bg-red-100 text-red-700',
                        room.status === 'cleaning' && 'bg-yellow-100 text-yellow-700'
                      )}
                    >
                      {RoomStatusLabel[room.status]}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-slate-600">
                    入住情况：
                    <span className="font-medium text-slate-800">
                      {occupied}/{total}人
                    </span>
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {roomBeds.map((bed) => (
                    <div
                      key={bed.id}
                      title={`${bed.bedNumber} - ${BedStatusLabel[bed.status]}`}
                      className={cn(
                        'w-7 h-7 rounded flex items-center justify-center text-white text-xs font-medium',
                        getBedCellClass(bed.status)
                      )}
                    >
                      {bed.bedNumber.slice(-1)}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {filteredRooms.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <p>暂无符合条件的房间</p>
          </div>
        )}
      </Card>

      <Modal
        open={!!selectedRoom}
        title={selectedRoom ? `房间 ${selectedRoom.roomNumber} 详情` : ''}
        onClose={() => setSelectedRoom(null)}
        footer={
          <Button variant="secondary" onClick={() => setSelectedRoom(null)}>
            关闭
          </Button>
        }
      >
        {selectedRoom && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-slate-500">房间号：</span>
                <span className="text-slate-800 font-medium">{selectedRoom.roomNumber}</span>
              </div>
              <div>
                <span className="text-slate-500">宿舍性别：</span>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-medium',
                    selectedRoom.gender === 'male' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
                  )}
                >
                  {RoomGenderLabel[selectedRoom.gender]}
                </span>
              </div>
              <div>
                <span className="text-slate-500">房间类型：</span>
                <span className="text-slate-800 font-medium">
                  {RoomTypeLabel[selectedRoom.roomType]}
                </span>
              </div>
              <div>
                <span className="text-slate-500">楼层：</span>
                <span className="text-slate-800 font-medium">{selectedRoom.floor}层</span>
              </div>
              <div>
                <span className="text-slate-500">房间状态：</span>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-medium',
                    selectedRoom.status === 'normal' && 'bg-green-100 text-green-700',
                    selectedRoom.status === 'maintenance' && 'bg-red-100 text-red-700',
                    selectedRoom.status === 'cleaning' && 'bg-yellow-100 text-yellow-700'
                  )}
                >
                  {RoomStatusLabel[selectedRoom.status]}
                </span>
              </div>
              <div>
                <span className="text-slate-500">额定人数：</span>
                <span className="text-slate-800 font-medium">{selectedRoom.maxOccupancy}人</span>
              </div>
              <div>
                <span className="text-slate-500">床位数：</span>
                <span className="text-slate-800 font-medium">{selectedRoom.bedCount}个</span>
              </div>
            </div>

            {selectedRoom.remark && (
              <div className="text-sm">
                <span className="text-slate-500">备注：</span>
                <span className="text-slate-800">{selectedRoom.remark}</span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-200">
              <h5 className="font-medium text-slate-700 mb-3">床位信息</h5>
              <div className="space-y-2">
                {getRoomBeds(selectedRoom.id).map((bed) => {
                  const bedWorker = getBedWorker(bed.workerId)
                  return (
                    <div
                      key={bed.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'w-8 h-8 rounded flex items-center justify-center text-white text-sm font-medium',
                            getBedCellClass(bed.status)
                          )}
                        >
                          {bed.bedNumber.slice(-1)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{bed.bedNumber}</p>
                          <p className="text-xs text-slate-500">{BedStatusLabel[bed.status]}</p>
                        </div>
                      </div>
                      {bedWorker ? (
                        <div className="text-right">
                          <p className="text-sm font-medium text-slate-800">{bedWorker.name}</p>
                          <p className="text-xs text-slate-500">
                            {bedWorker.workerNumber} · {bedWorker.team}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
