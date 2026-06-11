import { useEffect } from 'react'
import { Card, StatsCard, Table, Badge } from '../components/UI'
import { useDormitoryStore } from '../store/dormitory'
import {
  Building2,
  BedDouble,
  Users,
  UserCheck,
  Home,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react'

export default function Dashboard() {
  const { fetchOverview, fetchBuildings, overview, buildings } = useDormitoryStore()

  useEffect(() => {
    fetchOverview()
    fetchBuildings()
  }, [fetchOverview, fetchBuildings])

  const occupancyRate =
    overview && overview.totalBeds > 0
      ? Math.round((overview.occupiedBeds / overview.totalBeds) * 100)
      : 0

  const buildingStats = overview?.buildingStats || []
  const teamStats = overview?.teamStats || {}
  const teamList = Object.entries(teamStats).map(([name, count]) => ({ name, count }))

  const columns = [
    { key: 'name', label: '楼栋名称' },
    { key: 'roomCount', label: '房间数' },
    { key: 'bedCount', label: '床位数' },
    {
      key: 'occupiedCount',
      label: '已入住',
      render: (row: any) => (
        <span className="text-slate-700">
          {row.occupiedCount}/{row.bedCount}
        </span>
      ),
    },
    {
      key: 'occupancyRate',
      label: '入住率',
      render: (row: any) => (
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 rounded-full"
              style={{ width: `${row.occupancyRate}%` }}
            />
          </div>
          <span className="text-sm font-medium text-slate-700">{row.occupancyRate}%</span>
        </div>
      ),
    },
  ]

  const teamColumns = [
    { key: 'name', label: '班组名称' },
    { key: 'count', label: '人数' },
    {
      key: 'percent',
      label: '占比',
      render: (row: any) => {
        const total = teamList.reduce((sum: number, t: any) => sum + t.count, 0)
        const percent = total > 0 ? Math.round((row.count / total) * 100) : 0
        return (
          <div className="flex items-center gap-2">
            <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="text-sm text-slate-600">{percent}%</span>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="楼栋总数"
          value={overview?.totalBuildings || 0}
          icon={<Building2 className="h-6 w-6" />}
          color="orange"
        />
        <StatsCard
          title="房间总数"
          value={overview?.totalRooms || 0}
          icon={<Home className="h-6 w-6" />}
          color="blue"
          trend={`男${overview?.maleRooms || 0} / 女${overview?.femaleRooms || 0}`}
        />
        <StatsCard
          title="床位总数"
          value={overview?.totalBeds || 0}
          icon={<BedDouble className="h-6 w-6" />}
          color="purple"
          trend={`男${overview?.maleBeds || 0} / 女${overview?.femaleBeds || 0}`}
        />
        <StatsCard
          title="工人总数"
          value={overview?.totalWorkers || 0}
          icon={<Users className="h-6 w-6" />}
          color="green"
          trend={`男${overview?.maleWorkers || 0} / 女${overview?.femaleWorkers || 0}`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="已入住床位"
          value={overview?.occupiedBeds || 0}
          icon={<UserCheck className="h-6 w-6" />}
          color="orange"
          trend={`入住率 ${occupancyRate}%（男${overview?.occupiedMaleBeds || 0}/女${overview?.occupiedFemaleBeds || 0}）`}
          trendUp={occupancyRate > 50}
        />
        <StatsCard
          title="空闲床位"
          value={overview?.availableBeds || 0}
          icon={<BedDouble className="h-6 w-6" />}
          color="green"
        />
        <StatsCard
          title="维修中床位"
          value={overview?.maintenanceBeds || 0}
          icon={<AlertTriangle className="h-6 w-6" />}
          color="purple"
        />
        <StatsCard
          title="已入住工人"
          value={overview?.checkedInWorkers || 0}
          icon={<TrendingUp className="h-6 w-6" />}
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="各楼栋入住情况" className="lg:col-span-2">
          {buildingStats.length > 0 ? (
            <Table columns={columns} data={buildingStats} />
          ) : (
            <div className="text-center py-8 text-slate-400">暂无数据</div>
          )}
        </Card>

        <Card title="班组人员分布">
          {teamList.length > 0 ? (
            <Table columns={teamColumns} data={teamList} />
          ) : (
            <div className="text-center py-8 text-slate-400">暂无数据</div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">正常房间</p>
              <p className="text-2xl font-bold text-green-600">{overview?.normalRooms || 0}</p>
            </div>
            <Badge variant="success">正常</Badge>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">维修中房间</p>
              <p className="text-2xl font-bold text-red-600">{overview?.maintenanceRooms || 0}</p>
            </div>
            <Badge variant="danger">维修中</Badge>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">清扫中房间</p>
              <p className="text-2xl font-bold text-yellow-600">{overview?.cleaningRooms || 0}</p>
            </div>
            <Badge variant="warning">清扫中</Badge>
          </div>
        </Card>
      </div>
    </div>
  )
}
