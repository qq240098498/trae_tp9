import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  Users,
  BedDouble,
  Search,
  FileText,
  Menu,
  X,
  Home,
  Wrench,
  ClipboardList,
  Bell,
  BookOpen,
  Gauge,
  DollarSign,
  AlertTriangle,
  Wallet,
  FileCheck,
} from 'lucide-react'
import { cn } from '../lib/utils'

const navItems = [
  { to: '/', label: '仪表盘', icon: LayoutDashboard },
  { to: '/buildings', label: '楼栋管理', icon: Building2 },
  { to: '/rooms', label: '房间床位', icon: Home },
  { to: '/workers', label: '工人信息', icon: Users },
  { to: '/dormitory', label: '入住退宿', icon: BedDouble },
  { to: '/room-status', label: '房间状态', icon: Search },
  { to: '/utility-reading', label: '水电抄表', icon: Gauge },
  { to: '/bills', label: '费用核算', icon: DollarSign },
  { to: '/expense-ledger', label: '费用台账', icon: BookOpen },
  { to: '/reminders', label: '到期提醒', icon: Bell },
  { to: '/arrears', label: '欠费预警催收', icon: AlertTriangle },
  { to: '/deposit', label: '押金收支管理', icon: Wallet },
  { to: '/fee-supplement', label: '补缴与票据', icon: FileCheck },
  { to: '/devices', label: '设备管理', icon: Wrench },
  { to: '/maintenance', label: '维修工单', icon: ClipboardList },
  { to: '/records', label: '异动记录', icon: FileText },
]

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-screen bg-slate-100">
      <aside
        className={cn(
          'flex flex-col bg-slate-900 text-white transition-all duration-300',
          collapsed ? 'w-16' : 'w-60',
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-700">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-orange-400" />
              <span className="font-bold text-lg">工地宿舍管理</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded hover:bg-slate-700 transition-colors"
          >
            {collapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
          </button>
        </div>
        <nav className="flex-1 py-4 space-y-1 px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all',
                  isActive
                    ? 'bg-orange-500 text-white font-medium'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                  collapsed && 'justify-center',
                )
              }
              title={item.label}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm">{item.label}</span>}
            </NavLink>
          ))}
        </nav>
        {!collapsed && (
          <div className="p-4 border-t border-slate-700 text-xs text-slate-400">
            工地宿舍管理系统 v1.0
          </div>
        )}
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-800">工地宿舍管理系统</h1>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
