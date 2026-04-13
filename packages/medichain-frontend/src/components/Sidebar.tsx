import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  FileText,
  ScrollText,
  ShieldCheck,
  Lock,
  Network,
  HelpCircle,
  LogOut,
  PlusCircle,
  Stethoscope,
  Pill,
  HeartPulse,
  AlertTriangle,
  Share2,
  Users,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import type { UserRole } from '../types'

interface NavEntry {
  label: string
  path: string
  icon: React.ReactNode
  roles: UserRole[]
}

const NAV_ITEMS: NavEntry[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: <LayoutDashboard size={20} />,
    roles: ['admin', 'doctor', 'nurse', 'pharmacist', 'patient', 'auditor', 'researcher', 'emergency'],
  },
  {
    label: 'Doctor Portal',
    path: '/doctor',
    icon: <Stethoscope size={20} />,
    roles: ['admin', 'doctor'],
  },
  {
    label: 'Nurse Station',
    path: '/nurse',
    icon: <HeartPulse size={20} />,
    roles: ['admin', 'nurse', 'doctor'],
  },
  {
    label: 'Patient Records',
    path: '/records',
    icon: <FileText size={20} />,
    roles: ['admin', 'doctor', 'nurse', 'patient', 'auditor', 'researcher'],
  },
  {
    label: 'Pharmacy',
    path: '/pharmacy',
    icon: <Pill size={20} />,
    roles: ['admin', 'pharmacist', 'doctor'],
  },
  {
    label: 'Audit Logs',
    path: '/audit',
    icon: <ScrollText size={20} />,
    roles: ['admin', 'auditor', 'doctor'],
  },
  {
    label: 'Vault Access',
    path: '/access',
    icon: <Lock size={20} />,
    roles: ['admin', 'doctor', 'nurse', 'patient'],
  },
  {
    label: 'Security Settings',
    path: '/admin',
    icon: <ShieldCheck size={20} />,
    roles: ['admin'],
  },
  {
    label: 'Emergency',
    path: '/emergency',
    icon: <AlertTriangle size={20} />,
    roles: ['admin', 'doctor', 'emergency'],
  },
  {
    label: 'Access Sharing',
    path: '/sharing',
    icon: <Share2 size={20} />,
    roles: ['patient'],
  },
  {
    label: 'Medical Network',
    path: '/network',
    icon: <Network size={20} />,
    roles: ['admin', 'doctor'],
  },
]

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, disconnect } = useAuth()

  const filteredNav = NAV_ITEMS.filter(
    (item) => user && item.roles.includes(user.role)
  )

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 overflow-y-auto bg-surface shadow-[4px_0_40px_rgba(0,0,0,0.4)] flex flex-col py-8 px-5 z-50">
      {/* Brand */}
      <div className="flex flex-col gap-1 px-2 mb-8">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-container flex items-center justify-center">
            <ShieldCheck size={18} className="text-on-primary" />
          </div>
          <h1 className="text-xl font-extrabold text-primary font-headline tracking-tight">
            MediChain
          </h1>
        </div>
        <p className="label-sm text-on-surface-variant/50 pl-[42px]">
          Blockchain Connected
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 flex-grow">
        {filteredNav.map((item, i) => {
          const isActive = location.pathname === item.path
          return (
            <motion.button
              key={item.path}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              onClick={() => navigate(item.path)}
              className={`
                flex items-center gap-3 py-3 px-4 rounded-lg
                transition-all duration-200 text-sm font-medium w-full text-left
                ${
                  isActive
                    ? 'bg-surface-container-low text-primary font-semibold'
                    : 'text-on-surface-variant/60 hover:bg-surface-container-high/40 hover:text-on-surface'
                }
              `}
            >
              {/* Active indicator bar */}
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 w-[3px] h-8 rounded-r-full bg-primary"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span className={isActive ? 'text-primary' : ''}>{item.icon}</span>
              <span>{item.label}</span>
            </motion.button>
          )
        })}
      </nav>

      {/* New Record CTA */}
      <div className="px-2 mb-4">
        <button
          onClick={() => navigate('/doctor')}
          className="btn-primary w-full text-sm py-3"
        >
          <PlusCircle size={16} />
          New Record
        </button>
      </div>

      {/* Bottom */}
      <div className="flex flex-col gap-1 border-t border-outline-variant/[0.08] pt-4">
        <button className="flex items-center gap-3 py-2.5 px-4 rounded-lg text-sm text-on-surface-variant/50 hover:bg-surface-container-high/40 hover:text-on-surface transition-all w-full">
          <HelpCircle size={18} />
          Support
        </button>
        <button
          onClick={disconnect}
          className="flex items-center gap-3 py-2.5 px-4 rounded-lg text-sm text-on-surface-variant/50 hover:bg-surface-container-high/40 hover:text-tertiary transition-all w-full"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
