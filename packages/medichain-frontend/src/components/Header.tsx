import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Bell,
  Settings,
  Wifi,
  AlertTriangle,
  Copy,
  ChevronDown,
  Lock as LockIcon,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import type { UserRole } from '../types'
import toast from 'react-hot-toast'

const ROLE_BADGE_STYLES: Record<UserRole, { bg: string; text: string }> = {
  admin: { bg: 'bg-[#2d3449]', text: 'text-[#d0bcff]' },
  doctor: { bg: 'bg-secondary-container/20', text: 'text-on-secondary-container' },
  nurse: { bg: 'bg-primary-container/20', text: 'text-primary' },
  pharmacist: { bg: 'bg-[#412d00]', text: 'text-[#ffb951]' },
  patient: { bg: 'bg-surface-variant', text: 'text-on-surface-variant' },
  auditor: { bg: 'bg-[#2d3449]', text: 'text-secondary' },
  researcher: { bg: 'bg-[#2d3449]', text: 'text-secondary' },
  emergency: { bg: 'bg-error-container/30', text: 'text-tertiary' },
}

export default function Header() {
  const navigate = useNavigate()
  const { user, setDemoRole } = useAuth()
  const [searchOpen, setSearchOpen] = useState(false)
  const [roleMenuOpen, setRoleMenuOpen] = useState(false)

  if (!user) return null

  const badge = ROLE_BADGE_STYLES[user.role]

  const copyAddress = () => {
    navigator.clipboard?.writeText(user.address)
    toast.success('Address copied')
  }

  return (
    <header className="fixed top-0 right-0 w-[calc(100%-16rem)] z-40 h-16 glass-panel flex justify-between items-center px-8 font-body">
      {/* Left: Nav links */}
      <div className="flex items-center gap-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1.5 text-sm text-on-surface-variant/60 hover:text-primary transition-colors"
        >
          <Wifi size={14} />
          Network Status
        </button>
        <span className="w-1 h-1 rounded-full bg-primary" />
        <button
          onClick={() => navigate('/emergency')}
          className="text-sm text-primary font-semibold hover:text-primary/80 transition-colors"
        >
          Emergency Access
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 240, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <input
                autoFocus
                placeholder="Search patients, records..."
                className="input-vault text-sm py-2 px-4 bg-surface-container-lowest"
                onBlur={() => setSearchOpen(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="p-2 rounded-lg text-on-surface-variant/50 hover:text-on-surface hover:bg-surface-container-high/40 transition-all"
        >
          <Search size={18} />
        </button>

        {/* Wallet address chip */}
        <button
          onClick={copyAddress}
          className="flex items-center gap-2 bg-surface-container-high/60 rounded-full py-1.5 px-3 text-xs font-mono text-on-surface-variant/70 hover:text-on-surface transition-all"
        >
          <LockIcon size={12} className="text-primary" />
          {user.address}
          <Copy size={11} className="opacity-40" />
        </button>

        {/* Notifications */}
        <button className="p-2 rounded-lg text-on-surface-variant/50 hover:text-on-surface hover:bg-surface-container-high/40 transition-all relative">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-tertiary" />
        </button>

        {/* Settings */}
        <button
          onClick={() => navigate('/admin')}
          className="p-2 rounded-lg text-on-surface-variant/50 hover:text-on-surface hover:bg-surface-container-high/40 transition-all"
        >
          <Settings size={18} />
        </button>

        {/* Profile badge with role switcher */}
        <div className="relative">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-full hover:bg-surface-container-high/30 transition-all"
          >
            <div className="text-right">
              <p className="text-sm font-semibold text-on-surface leading-tight">
                {user.name}
              </p>
              <span
                className={`label-sm ${badge.bg} ${badge.text} px-2 py-0.5 rounded-full inline-block mt-0.5`}
              >
                {user.role}
              </span>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center text-sm font-bold text-on-surface">
              {user.name.charAt(0)}
            </div>
            <ChevronDown size={14} className="text-on-surface-variant/40" />
          </button>

          {/* Role switcher dropdown (demo) */}
          <AnimatePresence>
            {roleMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-52 bg-surface-container-high rounded-xl shadow-[0px_20px_40px_rgba(0,0,0,0.5)] overflow-hidden z-50"
              >
                <div className="p-3">
                  <p className="label-sm text-on-surface-variant/40 px-3 pb-2">
                    Switch Demo Role
                  </p>
                  {(
                    ['admin', 'doctor', 'nurse', 'pharmacist', 'patient', 'auditor', 'emergency'] as UserRole[]
                  ).map((role) => {
                    const s = ROLE_BADGE_STYLES[role]
                    return (
                      <button
                        key={role}
                        onClick={() => {
                          setDemoRole(role)
                          setRoleMenuOpen(false)
                          navigate('/dashboard')
                          toast.success(`Switched to ${role}`)
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm capitalize
                          ${user.role === role ? 'bg-surface-container/60 text-primary font-semibold' : 'text-on-surface-variant hover:bg-surface-container/40'}
                          transition-all`}
                      >
                        <span className={`inline-block w-2 h-2 rounded-full ${s.bg} mr-2`} />
                        {role}
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
