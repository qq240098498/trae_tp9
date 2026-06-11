import { useEffect, useMemo, useState } from 'react'
import { useDormitoryStore } from '../store/dormitory'
import { Card, Button, Table, Modal, Input, Select, Badge } from '../components/UI'
import { WorkerStatusLabel } from '../types'
import type { Worker, Room } from '../types'

export default function Workers() {
  const {
    workers,
    rooms,
    fetchWorkers,
    fetchRooms,
    addWorker,
    updateWorker,
    removeWorker,
  } = useDormitoryStore()

  const [searchKeyword, setSearchKeyword] = useState('')
  const [teamFilter, setTeamFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    gender: 'male' as Worker['gender'],
    idCard: '',
    workerNumber: '',
    phone: '',
    team: '',
    hometown: '',
    emergencyContact: '',
    emergencyPhone: '',
    status: 'active' as Worker['status'],
  })

  useEffect(() => {
    fetchWorkers()
    fetchRooms()
  }, [fetchWorkers, fetchRooms])

  const teamOptions = useMemo(() => {
    const teams = new Set<string>()
    ;(workers as Worker[]).forEach((w) => {
      if (w.team) teams.add(w.team)
    })
    return Array.from(teams).map((t) => ({ value: t, label: t }))
  }, [workers])

  const filteredWorkers = useMemo(() => {
    return (workers as Worker[]).filter((worker) => {
      if (searchKeyword) {
        const keyword = searchKeyword.toLowerCase()
        if (
          !worker.name.toLowerCase().includes(keyword) &&
          !worker.workerNumber.toLowerCase().includes(keyword) &&
          !worker.phone.toLowerCase().includes(keyword)
        ) {
          return false
        }
      }
      if (teamFilter && worker.team !== teamFilter) return false
      if (statusFilter && worker.status !== statusFilter) return false
      return true
    })
  }, [workers, searchKeyword, teamFilter, statusFilter])

  const getRoomInfo = (roomId?: string) => {
    if (!roomId) return '-'
    const room = (rooms as Room[]).find((r) => r.id === roomId)
    return room ? room.roomNumber : '-'
  }

  const getGenderLabel = (gender: Worker['gender']) => {
    return gender === 'male' ? '男' : '女'
  }

  const getStatusBadgeVariant = (status: Worker['status']) => {
    switch (status) {
      case 'active':
        return 'success'
      case 'inactive':
        return 'warning'
      case 'left':
        return 'danger'
      default:
        return 'default'
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      gender: 'male',
      idCard: '',
      workerNumber: '',
      phone: '',
      team: '',
      hometown: '',
      emergencyContact: '',
      emergencyPhone: '',
      status: 'active',
    })
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      alert('请输入姓名')
      return false
    }
    if (!formData.workerNumber.trim()) {
      alert('请输入工号')
      return false
    }
    if (!formData.phone.trim()) {
      alert('请输入电话')
      return false
    }
    if (!formData.idCard.trim()) {
      alert('请输入身份证号')
      return false
    }
    return true
  }

  const handleAddWorker = async () => {
    if (!validateForm()) return
    await addWorker(formData)
    setAddModalOpen(false)
    resetForm()
  }

  const handleEditWorker = async () => {
    if (!selectedWorker || !validateForm()) return
    await updateWorker(selectedWorker.id, formData)
    setEditModalOpen(false)
    setSelectedWorker(null)
    resetForm()
  }

  const handleDeleteWorker = async () => {
    if (!selectedWorker) return
    await removeWorker(selectedWorker.id)
    setDeleteModalOpen(false)
    setSelectedWorker(null)
  }

  const openEditModal = (worker: Worker) => {
    setSelectedWorker(worker)
    setFormData({
      name: worker.name,
      gender: worker.gender,
      idCard: worker.idCard,
      workerNumber: worker.workerNumber,
      phone: worker.phone,
      team: worker.team,
      hometown: worker.hometown,
      emergencyContact: worker.emergencyContact,
      emergencyPhone: worker.emergencyPhone,
      status: worker.status,
    })
    setEditModalOpen(true)
  }

  const openDeleteModal = (worker: Worker) => {
    setSelectedWorker(worker)
    setDeleteModalOpen(true)
  }

  const columns = [
    { key: 'workerNumber', label: '工号' },
    { key: 'name', label: '姓名' },
    { key: 'gender', label: '性别', render: (row: Worker) => getGenderLabel(row.gender) },
    { key: 'idCard', label: '身份证号' },
    { key: 'phone', label: '电话' },
    { key: 'team', label: '班组' },
    { key: 'hometown', label: '籍贯' },
    {
      key: 'status',
      label: '状态',
      render: (row: Worker) => (
        <Badge variant={getStatusBadgeVariant(row.status)}>
          {WorkerStatusLabel[row.status]}
        </Badge>
      ),
    },
    {
      key: 'roomId',
      label: '入住房间',
      render: (row: Worker) => getRoomInfo(row.roomId),
    },
    {
      key: 'actions',
      label: '操作',
      width: '160px',
      render: (row: Worker) => (
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => openEditModal(row)}>
            编辑
          </Button>
          <Button size="sm" variant="danger" onClick={() => openDeleteModal(row)}>
            删除
          </Button>
        </div>
      ),
    },
  ]

  const renderForm = () => (
    <div className="space-y-4">
      <Input
        label="姓名"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="请输入姓名"
      />
      <Select
        label="性别"
        value={formData.gender}
        onChange={(e) =>
          setFormData({ ...formData, gender: e.target.value as Worker['gender'] })
        }
        options={[
          { value: 'male', label: '男' },
          { value: 'female', label: '女' },
        ]}
      />
      <Input
        label="身份证号"
        value={formData.idCard}
        onChange={(e) => setFormData({ ...formData, idCard: e.target.value })}
        placeholder="请输入身份证号"
      />
      <Input
        label="工号"
        value={formData.workerNumber}
        onChange={(e) => setFormData({ ...formData, workerNumber: e.target.value })}
        placeholder="请输入工号"
      />
      <Input
        label="电话"
        value={formData.phone}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        placeholder="请输入电话"
      />
      <Input
        label="班组"
        value={formData.team}
        onChange={(e) => setFormData({ ...formData, team: e.target.value })}
        placeholder="请输入班组"
      />
      <Input
        label="籍贯"
        value={formData.hometown}
        onChange={(e) => setFormData({ ...formData, hometown: e.target.value })}
        placeholder="请输入籍贯"
      />
      <Input
        label="紧急联系人"
        value={formData.emergencyContact}
        onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
        placeholder="请输入紧急联系人"
      />
      <Input
        label="紧急联系电话"
        value={formData.emergencyPhone}
        onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
        placeholder="请输入紧急联系电话"
      />
      <Select
        label="状态"
        value={formData.status}
        onChange={(e) =>
          setFormData({ ...formData, status: e.target.value as Worker['status'] })
        }
        options={[
          { value: 'active', label: '在职' },
          { value: 'inactive', label: '停职' },
          { value: 'left', label: '已离职' },
        ]}
      />
    </div>
  )

  return (
    <div className="space-y-6">
      <Card
        title="工人信息管理"
        actions={<Button onClick={() => setAddModalOpen(true)}>新增工人</Button>}
      >
        <div className="flex flex-wrap gap-4 mb-6">
          <Input
            label="搜索"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="姓名/工号/电话"
            className="w-56"
          />
          <Select
            label="班组"
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            options={[{ value: '', label: '全部班组' }, ...teamOptions]}
            className="w-44"
          />
          <Select
            label="状态"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: '全部状态' },
              { value: 'active', label: '在职' },
              { value: 'inactive', label: '停职' },
              { value: 'left', label: '已离职' },
            ]}
            className="w-44"
          />
        </div>

        <Table columns={columns} data={filteredWorkers} emptyText="暂无工人数据" />
      </Card>

      <Modal
        open={addModalOpen}
        title="新增工人"
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
            <Button onClick={handleAddWorker}>确认新增</Button>
          </>
        }
      >
        {renderForm()}
      </Modal>

      <Modal
        open={editModalOpen}
        title="编辑工人"
        onClose={() => {
          setEditModalOpen(false)
          setSelectedWorker(null)
          resetForm()
        }}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setEditModalOpen(false)
                setSelectedWorker(null)
                resetForm()
              }}
            >
              取消
            </Button>
            <Button onClick={handleEditWorker}>保存</Button>
          </>
        }
      >
        {renderForm()}
      </Modal>

      <Modal
        open={deleteModalOpen}
        title="确认删除"
        onClose={() => {
          setDeleteModalOpen(false)
          setSelectedWorker(null)
        }}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setDeleteModalOpen(false)
                setSelectedWorker(null)
              }}
            >
              取消
            </Button>
            <Button variant="danger" onClick={handleDeleteWorker}>
              确认删除
            </Button>
          </>
        }
      >
        <div className="text-slate-600">
          确定要删除工人「{selectedWorker?.name}」吗？此操作不可恢复。
        </div>
      </Modal>
    </div>
  )
}
