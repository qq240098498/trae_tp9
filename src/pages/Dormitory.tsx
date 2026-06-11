import { useEffect, useState } from 'react'
import { Card, Button, Select, Input, Textarea } from '../components/UI'
import { useDormitoryStore } from '../store/dormitory'
import {
  Building,
  Room,
  Bed,
  Worker,
  RoomTypeLabel,
} from '../types'
import { cn } from '../lib/utils'

type TabType = 'checkin' | 'checkout' | 'transfer'

export default function Dormitory() {
  const [activeTab, setActiveTab] = useState<TabType>('checkin')

  const tabs: { key: TabType; label: string }[] = [
    { key: 'checkin', label: '入住办理' },
    { key: 'checkout', label: '退宿办理' },
    { key: 'transfer', label: '调房办理' },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex gap-2 border-b border-slate-200 -mx-6 -mt-6 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px',
                activeTab === tab.key
                  ? 'text-orange-600 border-orange-500'
                  : 'text-slate-500 border-transparent hover:text-slate-700',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </Card>

      {activeTab === 'checkin' && <CheckInForm />}
      {activeTab === 'checkout' && <CheckOutForm />}
      {activeTab === 'transfer' && <TransferForm />}
    </div>
  )
}

function CheckInForm() {
  const { buildings, rooms, beds, workers, fetchBuildings, fetchRooms, fetchBeds, fetchWorkers, checkIn } =
    useDormitoryStore()

  const [workerId, setWorkerId] = useState('')
  const [buildingId, setBuildingId] = useState('')
  const [roomId, setRoomId] = useState('')
  const [bedId, setBedId] = useState('')
  const [operator, setOperator] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchBuildings()
    fetchWorkers()
  }, [fetchBuildings, fetchWorkers])

  useEffect(() => {
    if (buildingId) {
      fetchRooms({ buildingId })
    } else {
      setRoomId('')
      setBedId('')
    }
  }, [buildingId, fetchRooms])

  useEffect(() => {
    if (roomId) {
      fetchBeds({ roomId })
    } else {
      setBedId('')
    }
  }, [roomId, fetchBeds])

  const availableWorkers = (workers as Worker[]).filter(
    (w) => w.status === 'active' && !w.bedId
  )
  const availableBeds = (beds as Bed[]).filter((b) => b.status === 'available')

  const handleSubmit = async () => {
    if (!workerId || !bedId || !operator) {
      alert('请填写完整信息')
      return
    }
    setSubmitting(true)
    try {
      await checkIn({ workerId, bedId, operator, reason })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      setWorkerId('')
      setBuildingId('')
      setRoomId('')
      setBedId('')
      setOperator('')
      setReason('')
    } catch (e: any) {
      alert(e.message || '操作失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card title="入住办理">
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          入住办理成功！
        </div>
      )}
      <div className="space-y-4 max-w-xl">
        <Select
          label="选择工人"
          value={workerId}
          onChange={(e) => setWorkerId(e.target.value)}
          options={[
            { value: '', label: '请选择工人' },
            ...availableWorkers.map((w) => ({
              value: w.id,
              label: `${w.name} - ${w.workerNumber} (${w.team})`,
            })),
          ]}
        />
        <div className="grid grid-cols-3 gap-4">
          <Select
            label="选择楼栋"
            value={buildingId}
            onChange={(e) => setBuildingId(e.target.value)}
            options={[
              { value: '', label: '请选择楼栋' },
              ...(buildings as Building[]).map((b) => ({
                value: b.id,
                label: b.name,
              })),
            ]}
          />
          <Select
            label="选择房间"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            options={[
              { value: '', label: '请选择房间' },
              ...(rooms as Room[])
                .filter((r) => r.buildingId === buildingId)
                .map((r) => ({
                  value: r.id,
                  label: `${r.roomNumber} (${RoomTypeLabel[r.roomType]})`,
                })),
            ]}
          />
          <Select
            label="选择床位"
            value={bedId}
            onChange={(e) => setBedId(e.target.value)}
            options={[
              { value: '', label: '请选择床位' },
              ...availableBeds
                .filter((b) => b.roomId === roomId)
                .map((b) => ({
                  value: b.id,
                  label: b.bedNumber,
                })),
            ]}
          />
        </div>
        <Input
          label="办理人"
          value={operator}
          onChange={(e) => setOperator(e.target.value)}
          placeholder="请输入办理人姓名"
        />
        <Textarea
          label="备注原因"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="请输入备注原因（选填）"
          rows={3}
        />
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? '提交中...' : '提交入住'}
        </Button>
      </div>
    </Card>
  )
}

function CheckOutForm() {
  const { workers, rooms, beds, buildings, fetchWorkers, fetchBeds, fetchRooms, fetchBuildings, checkOut } = useDormitoryStore()

  const [workerId, setWorkerId] = useState('')
  const [operator, setOperator] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchWorkers()
    fetchRooms()
    fetchBeds()
    fetchBuildings()
  }, [fetchWorkers, fetchBeds, fetchRooms, fetchBuildings])

  const occupiedWorkers = (workers as Worker[]).filter(
    (w) => w.status === 'active' && w.bedId
  )

  const selectedWorker = (workers as Worker[]).find((w) => w.id === workerId)
  const selectedBed = (beds as Bed[]).find((b) => b.id === selectedWorker?.bedId)
  const selectedRoom = (rooms as Room[]).find((r) => r.id === selectedBed?.roomId)
  const selectedBuilding = (buildings as Building[]).find(
    (b) => b.id === selectedRoom?.buildingId
  )

  const handleSubmit = async () => {
    if (!workerId || !operator) {
      alert('请填写完整信息')
      return
    }
    setSubmitting(true)
    try {
      await checkOut({ workerId, operator, reason })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      setWorkerId('')
      setOperator('')
      setReason('')
    } catch (e: any) {
      alert(e.message || '操作失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card title="退宿办理">
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          退宿办理成功！
        </div>
      )}
      <div className="space-y-4 max-w-xl">
        <Select
          label="选择工人"
          value={workerId}
          onChange={(e) => setWorkerId(e.target.value)}
          options={[
            { value: '', label: '请选择已入住工人' },
            ...occupiedWorkers.map((w) => ({
              value: w.id,
              label: `${w.name} - ${w.workerNumber} (${w.team})`,
            })),
          ]}
        />

        {selectedWorker && selectedRoom && (
          <div className="p-4 bg-slate-50 rounded-lg space-y-2">
            <h4 className="font-medium text-slate-700">当前入住信息</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-slate-500">工人姓名：</span>
                <span className="text-slate-800">{selectedWorker.name}</span>
              </div>
              <div>
                <span className="text-slate-500">工号：</span>
                <span className="text-slate-800">{selectedWorker.workerNumber}</span>
              </div>
              <div>
                <span className="text-slate-500">所在楼栋：</span>
                <span className="text-slate-800">{selectedBuilding?.name}</span>
              </div>
              <div>
                <span className="text-slate-500">房间号：</span>
                <span className="text-slate-800">{selectedRoom.roomNumber}</span>
              </div>
              <div>
                <span className="text-slate-500">床位号：</span>
                <span className="text-slate-800">{selectedBed?.bedNumber}</span>
              </div>
              <div>
                <span className="text-slate-500">入住日期：</span>
                <span className="text-slate-800">
                  {selectedWorker.checkInDate
                    ? new Date(selectedWorker.checkInDate).toLocaleDateString()
                    : '-'}
                </span>
              </div>
            </div>
          </div>
        )}

        <Input
          label="办理人"
          value={operator}
          onChange={(e) => setOperator(e.target.value)}
          placeholder="请输入办理人姓名"
        />
        <Textarea
          label="退宿原因"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="请输入退宿原因"
          rows={3}
        />
        <Button variant="danger" onClick={handleSubmit} disabled={submitting}>
          {submitting ? '提交中...' : '提交退宿'}
        </Button>
      </div>
    </Card>
  )
}

function TransferForm() {
  const {
    buildings, rooms, beds, workers, fetchBuildings, fetchRooms, fetchBeds, fetchWorkers, transfer
  } = useDormitoryStore()

  const [workerId, setWorkerId] = useState('')
  const [toBuildingId, setToBuildingId] = useState('')
  const [toRoomId, setToRoomId] = useState('')
  const [toBedId, setToBedId] = useState('')
  const [operator, setOperator] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchBuildings()
    fetchWorkers()
    fetchRooms()
    fetchBeds()
  }, [fetchBuildings, fetchWorkers, fetchRooms, fetchBeds])

  useEffect(() => {
    if (toBuildingId) {
      fetchRooms({ buildingId: toBuildingId })
    } else {
      setToRoomId('')
      setToBedId('')
    }
  }, [toBuildingId, fetchRooms])

  useEffect(() => {
    if (toRoomId) {
      fetchBeds({ roomId: toRoomId })
    } else {
      setToBedId('')
    }
  }, [toRoomId, fetchBeds])

  const occupiedWorkers = (workers as Worker[]).filter(
    (w) => w.status === 'active' && w.bedId
  )
  const availableBeds = (beds as Bed[]).filter((b) => b.status === 'available')

  const selectedWorker = (workers as Worker[]).find((w) => w.id === workerId)
  const currentBed = (beds as Bed[]).find((b) => b.id === selectedWorker?.bedId)
  const currentRoom = (rooms as Room[]).find((r) => r.id === currentBed?.roomId)
  const currentBuilding = (buildings as Building[]).find((b) => b.id === currentRoom?.buildingId)

  const handleSubmit = async () => {
    if (!workerId || !toBedId || !operator) {
      alert('请填写完整信息')
      return
    }
    setSubmitting(true)
    try {
      await transfer({ workerId, toBedId, operator, reason })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      setWorkerId('')
      setToBuildingId('')
      setToRoomId('')
      setToBedId('')
      setOperator('')
      setReason('')
    } catch (e: any) {
      alert(e.message || '操作失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card title="调房办理">
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          调房办理成功！
        </div>
      )}
      <div className="space-y-4 max-w-xl">
        <Select
          label="选择工人"
          value={workerId}
          onChange={(e) => setWorkerId(e.target.value)}
          options={[
            { value: '', label: '请选择已入住工人' },
            ...occupiedWorkers.map((w) => ({
              value: w.id,
              label: `${w.name} - ${w.workerNumber} (${w.team})`,
            })),
          ]}
        />

        {selectedWorker && currentRoom && (
          <div className="p-4 bg-slate-50 rounded-lg space-y-2">
            <h4 className="font-medium text-slate-700">当前床位</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-slate-500">所在楼栋：</span>
                <span className="text-slate-800">{currentBuilding?.name}</span>
              </div>
              <div>
                <span className="text-slate-500">房间号：</span>
                <span className="text-slate-800">{currentRoom.roomNumber}</span>
              </div>
              <div>
                <span className="text-slate-500">床位号：</span>
                <span className="text-slate-800">{currentBed?.bedNumber}</span>
              </div>
              <div>
                <span className="text-slate-500">房间类型：</span>
                <span className="text-slate-800">{RoomTypeLabel[currentRoom.roomType]}</span>
              </div>
            </div>
          </div>
        )}

        <div className="pt-2">
          <h4 className="font-medium text-slate-700 mb-3">选择目标空闲床位</h4>
          <div className="grid grid-cols-3 gap-4">
            <Select
              label="目标楼栋"
              value={toBuildingId}
              onChange={(e) => setToBuildingId(e.target.value)}
              options={[
                { value: '', label: '请选择楼栋' },
                ...(buildings as Building[]).map((b) => ({
                  value: b.id,
                  label: b.name,
                })),
              ]}
            />
            <Select
              label="目标房间"
              value={toRoomId}
              onChange={(e) => setToRoomId(e.target.value)}
              options={[
                { value: '', label: '请选择房间' },
                ...(rooms as Room[])
                  .filter((r) => r.buildingId === toBuildingId)
                  .map((r) => ({
                    value: r.id,
                    label: `${r.roomNumber} (${RoomTypeLabel[r.roomType]})`,
                  })),
              ]}
            />
            <Select
              label="目标床位"
              value={toBedId}
              onChange={(e) => setToBedId(e.target.value)}
              options={[
                { value: '', label: '请选择床位' },
                ...availableBeds
                  .filter((b) => b.roomId === toRoomId)
                  .map((b) => ({
                    value: b.id,
                    label: b.bedNumber,
                  })),
              ]}
            />
          </div>
        </div>

        <Input
          label="办理人"
          value={operator}
          onChange={(e) => setOperator(e.target.value)}
          placeholder="请输入办理人姓名"
        />
        <Textarea
          label="调房原因"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="请输入调房原因"
          rows={3}
        />
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? '提交中...' : '提交调房'}
        </Button>
      </div>
    </Card>
  )
}
