import { motion } from 'framer-motion'
import {
  Activity,
  FileText,
  Users,
  Shield,
  TrendingUp,
  Clock,
  Hexagon,
  ArrowUpRight,
  Server,
  Zap,
  Lock,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4 },
})

const STATS = [
  { label: 'Active Records', value: '12,847', change: '+3.2%', icon: <FileText size={20} />, color: 'primary' },
  { label: 'Authorized Providers', value: '342', change: '+12', icon: <Users size={20} />, color: 'secondary' },
  { label: 'Access Grants', value: '1,203', change: '89 active', icon: <Shield size={20} />, color: 'primary' },
  { label: 'Audit Events (24h)', value: '4,891', change: '+18.4%', icon: <Activity size={20} />, color: 'tertiary' },
]

const RECENT_LEDGER = [
  { action: 'Record Created', actor: 'Dr. Sarah Chen', target: 'Patient #8821', time: '2m ago', type: 'create' },
  { action: 'Access Granted', actor: 'James Hartwell', target: 'Mayo Clinic', time: '14m ago', type: 'grant' },
  { action: 'Prescription Issued', actor: 'Dr. Kenji Mori', target: 'Patient #3392', time: '28m ago', type: 'prescription' },
  { action: 'Access Revoked', actor: 'System', target: 'Expired Grant #441', time: '1h ago', type: 'revoke' },
  { action: 'Vitals Updated', actor: 'Nurse Tanaka', target: 'Patient #1102', time: '1h ago', type: 'update' },
  { action: 'Emergency Break-Glass', actor: 'EMT Override', target: 'Patient #7703', time: '3h ago', type: 'emergency' },
]

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-primary/10 text-primary',
  grant: 'bg-secondary/10 text-secondary',
  prescription: 'bg-[#412d00] text-[#ffb951]',
  revoke: 'bg-tertiary/10 text-tertiary',
  update: 'bg-primary/10 text-primary',
  emergency: 'bg-error-container/30 text-tertiary',
}

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <div className="space-y-8">
      {/* Page header */}
      <motion.div {...fadeUp(0)}>
        <h1 className="text-2xl font-extrabold text-on-surface font-headline">
          Clinical Console
        </h1>
        <p className="text-sm text-on-surface-variant/50 mt-1">
          Real-time overview of the MediChain decentralized medical network
        </p>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            {...fadeUp(0.1 + i * 0.08)}
            className="card p-6 group hover:shadow-[0px_20px_60px_rgba(0,0,0,0.5)] transition-shadow duration-300"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2.5 rounded-xl ${stat.color === 'primary' ? 'bg-primary/10' : stat.color === 'secondary' ? 'bg-secondary/10' : 'bg-tertiary/10'}`}>
                <span className={stat.color === 'primary' ? 'text-primary' : stat.color === 'secondary' ? 'text-secondary' : 'text-tertiary'}>
                  {stat.icon}
                </span>
              </div>
              <span className="label-sm text-primary flex items-center gap-1">
                <TrendingUp size={12} />
                {stat.change}
              </span>
            </div>
            <p className="text-2xl font-extrabold text-on-surface font-headline">
              {stat.value}
            </p>
            <p className="text-xs text-on-surface-variant/50 mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Ledger Activity */}
        <motion.div {...fadeUp(0.3)} className="lg:col-span-8 card overflow-hidden">
          <div className="p-6 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-on-surface font-headline">
                Recent Ledger Activity
              </h2>
              <p className="text-xs text-on-surface-variant/40 mt-0.5">
                Immutable transaction log from the blockchain
              </p>
            </div>
            <button className="btn-secondary py-2 px-4 text-xs">
              View All
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="px-6 pb-6">
            <div className="space-y-2">
              {RECENT_LEDGER.map((entry, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.06 }}
                  className="flex items-center gap-4 p-3.5 rounded-xl bg-surface-container-high/30 hover:bg-surface-container-high/50 transition-colors group"
                >
                  <span className={`label-sm px-2.5 py-1 rounded-full whitespace-nowrap ${ACTION_COLORS[entry.type]}`}>
                    {entry.action}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-on-surface truncate">
                      <span className="font-medium">{entry.actor}</span>
                      <span className="text-on-surface-variant/40 mx-2">→</span>
                      <span className="text-on-surface-variant">{entry.target}</span>
                    </p>
                  </div>
                  <span className="text-[0.65rem] text-on-surface-variant/30 font-mono flex items-center gap-1">
                    <Clock size={10} />
                    {entry.time}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Node Health & Network */}
        <motion.div {...fadeUp(0.35)} className="lg:col-span-4 space-y-6">
          {/* Node health */}
          <div className="card p-6">
            <h3 className="text-sm font-bold text-on-surface font-headline mb-5 flex items-center gap-2">
              <Server size={16} className="text-primary" />
              Network Health
            </h3>

            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-on-surface-variant/60">Validation Nodes</span>
                  <span className="text-primary font-mono font-semibold">99.98%</span>
                </div>
                <div className="w-full bg-surface-container-lowest h-2 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '99.98%' }}
                    transition={{ delay: 0.6, duration: 1.2, ease: 'easeOut' }}
                    className="bg-gradient-to-r from-primary to-primary-container h-full rounded-full shadow-[0_0_8px_rgba(78,222,163,0.5)]"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant/60 flex items-center gap-2">
                  <Zap size={14} className="text-secondary" />
                  Consensus Latency
                </span>
                <span className="text-secondary font-mono">12ms</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant/60 flex items-center gap-2">
                  <Lock size={14} className="text-primary" />
                  Encryption Layer
                </span>
                <span className="text-primary font-mono">AES-256</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant/60 flex items-center gap-2">
                  <Hexagon size={14} className="text-secondary" />
                  Block Height
                </span>
                <span className="text-on-surface font-mono">4,291,003</span>
              </div>
            </div>
          </div>

          {/* Security Score */}
          <div className="card p-6">
            <h3 className="text-sm font-bold text-on-surface font-headline mb-4">
              Network Security Score
            </h3>
            <div className="flex items-end gap-3 mb-3">
              <span className="text-4xl font-extrabold text-primary font-headline">94</span>
              <span className="text-on-surface-variant/40 text-sm mb-1">/100</span>
            </div>
            <div className="w-full bg-surface-container-lowest h-2.5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '94%' }}
                transition={{ delay: 0.8, duration: 1.0, ease: 'easeOut' }}
                className="bg-gradient-to-r from-primary to-primary-container h-full rounded-full"
              />
            </div>
            <p className="text-[0.65rem] text-on-surface-variant/30 mt-3 italic">
              Security score reflects encryption rotation frequency and permission hygiene.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
