import { useEffect, useState } from 'react'
import { Card, Button, Table, Modal, Input, Textarea, Badge } from '../components/UI'
import { useDormitoryStore } from '../store/dormitory'
import type { Building } from '../types'
import { Plus, Edit, Trash2 } from 'lucide-react'

export default function Buildings() {
  const { buildings, fetchBuildings, addBuilding, updateBuilding, removeBuilding, rooms, beds } =
    useDormitoryStore()

  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    floorCount: 1,
    remark: '',
  })

  useEffect(() => {
    fetchBuildings()
  }, [fetchBuildings])

  const getBuildingStats = (buildingId: string) => {
    const roomCount = rooms.filter((r: any) => r.buildingId === buildingId).length
    const roomIds = rooms.filter((r: any) => r.buildingId === buildingId).map((r: any) => r.id)
    const bedCount = beds.filter((b: any) => roomIds.includes(b.roomId)).length
    const occupiedCount = beds.filter(
      (b: any) => roomIds.includes(b.roomId) && b.status === 'occupied',
    ).length
    return { roomCount, bedCount, occupiedCount }
  }

  const resetForm = () => {
    setFormData({ name: '', code: '', floorCount: 1, remark: '' })
  }

  const handleAdd = async () => {
    if (!formData.name.trim() || !formData.code.trim()) {
      alert('请填写楼栋名称和编号')
      return
    }
    await addBuilding(formData)
    setAddModalOpen(false)
    resetForm()
  }

  const handleEdit = async () => {
    if (!selectedBuilding) return
    await updateBuilding(selectedBuilding.id, formData)
    setEditModalOpen(false)
    setSelectedBuilding(null)
    resetForm()
  }

  const handleDelete = async () => {
    if (!selectedBuilding) return
    try {
      await removeBuilding(selectedBuilding.id)
      setDeleteModalOpen(false)
      setSelectedBuilding(null)
    } catch (e: any) {
      alert(e.message)
    }
  }

  const openEditModal = (building: Building) => {
    setSelectedBuilding(building)
    setFormData({
      name: building.name,
      code: building.code,
      floorCount: building.floorCount,
      remark: building.remark || '',
    })
    setEditModalOpen(true)
  }

  const openDeleteModal = (building: Building) => {
    setSelectedBuilding(building)
    setDeleteModalOpen(true)
  }

  const columns = [
    { key: 'name', label: '楼栋名称' },
    { key: 'code', label: '楼栋编号' },
    { key: 'floorCount', label: '楼层数' },
    {
      key: 'stats',
      label: '房间/床位',
      render: (row: Building) => {
        const stats = getBuildingStats(row.id)
        return (
          <span className="text-slate-600">
            {stats.roomCount}间 / {stats.bedCount}床 (已住{stats.occupiedCount})
          </span>
        )
      },
    },
    {
      key: 'remark',
      label: '备注',
      render: (row: Building) => <span className="text-slate-500">{row.remark || '-'}</span>,
    },
    {
      key: 'actions',
      label: '操作',
      width: '160px',
      render: (row: Building) => (
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

  const renderForm = () => (
    <div className="space-y-4">
      <Input
        label="楼栋名称"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="如：1号楼"
      />
      <Input
        label="楼栋编号"
        value={formData.code}
        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
        placeholder="如：BLD001"
      />
      <Input
        label="楼层数"
        type="number"
        min={1}
        value={formData.floorCount}
        onChange={(e) => setFormData({ ...formData, floorCount: Number(e.target.value) })}
      />
      <Textarea
        label="备注"
        value={formData.remark}
        onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
        placeholder="选填"
        rows={3}
      />
    </div>
  )

  return (
    <div className="space-y-6">
      <Card
        title="宿舍楼栋管理"
        actions={
          <Button onClick={() => setAddModalOpen(true)}>
            <Plus className="h-4 w-4" />
            新增楼栋
          </Button>
        }
      >
        <Table columns={columns} data={buildings} emptyText="暂无楼栋数据" />
      </Card>

      <Modal
        open={addModalOpen}
        title="新增楼栋"
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
        {renderForm()}
      </Modal>

      <Modal
        open={editModalOpen}
        title="编辑楼栋"
        onClose={() => {
          setEditModalOpen(false)
          setSelectedBuilding(null)
          resetForm()
        }}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setEditModalOpen(false)
                setSelectedBuilding(null)
                resetForm()
              }}
            >
              取消
            </Button>
            <Button onClick={handleEdit}>保存</Button>
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
          setSelectedBuilding(null)
        }}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setDeleteModalOpen(false)
                setSelectedBuilding(null)
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
          确定要删除楼栋「{selectedBuilding?.name}」吗？
          <p className="mt-2 text-sm text-red-500">
            注意：该楼栋下还有房间时将无法删除。
          </p>
        </div>
      </Modal>
    </div>
  )
}
