import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Share2,
  UserPlus,
  ShieldCheck,
  Clock,
  XCircle,
  Heart,
  Building2,
  Stethoscope,
  Send,
  Info,
} from 'lucide-react'
import toast from 'react-hot-toast'

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4 },
})

interface SharedAccess {
  id: string
  name: string
  type: 'doctor' | 'hospital' | 'family'
  description: string
  sharedSince: string
  expiresIn: string | null
}

const INITIAL_SHARES: SharedAccess[] = [
  { id: '1', name: 'Dr. Sarah Chen', type: 'doctor', description: 'Primary Care Physician', sharedSince: 'Mar 1, 2026', expiresIn: null },
  { id: '2', name: 'Mayo Clinic', type: 'hospital', description: 'Oncology Department', sharedSince: 'Apr 10, 2026', expiresIn: '14h 22m' },
  { id: '3', name: 'Maria Hartwell', type: 'family', description: 'Emergency Contact / Spouse', sharedSince: 'Jan 15, 2026', expiresIn: null },
]

const TYPE_ICONS: Record<string, React.ReactNode> = {
  doctor: <Stethoscope size={18} />,
  hospital: <Building2 size={18} />,
  family: <Heart size={18} />,
}

const TYPE_COLORS: Record<string, string> = {
  doctor: 'bg-secondary/10 text-secondary',
  hospital: 'bg-primary/10 text-primary',
  family: 'bg-tertiary/10 text-tertiary',
}

export default function SharingPage() {
  const [shares, setShares] = useState(INITIAL_SHARES)
  const [showAdd, setShowAdd] = useState(false)
  const [shareType, setShareType] = useState<'doctor' | 'hospital' | 'family'>('doctor')

  const revoke = (id: string) => {
    setShares((prev) => prev.filter((s) => s.id !== id))
    toast.success('Access revoked successfully')
  }

  const addShare = () => {
    toast.success('Access invitation sent')
    setShowAdd(false)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <motion.div {...fadeUp(0)}>
        <h1 className="text-2xl font-extrabold text-on-surface font-headline">My Health Data Sharing</h1>
        <p className="text-sm text-on-surface-variant/50 mt-1">
          Control who can view your medical records. You own your data — share it on your terms.
        </p>
      </motion.div>

      {/* Quick info */}
      <motion.div {...fadeUp(0.05)} className="flex items-start gap-3 p-5 bg-surface-container-high/20 rounded-xl">
        <Info size={18} className="text-secondary mt-0.5 shrink-0" />
        <div>
          <p className="text-sm text-on-surface font-medium mb-1">Your Records Are Encrypted</p>
          <p className="text-xs text-on-surface-variant/40 leading-relaxed">
            Only people you share access with can decrypt and view your records. Access is time-limited by default and you can revoke it at any time. Every access event is recorded on the blockchain.
          </p>
        </div>
      </motion.div>

      {/* Add new share button */}
      <motion.div {...fadeUp(0.1)}>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary py-3 px-6">
          <UserPlus size={16} />
          Share My Records
        </button>
      </motion.div>

      {/* Add share form */}
      {showAdd && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="card p-6">
          <h3 className="text-sm font-bold text-on-surface font-headline mb-5">Share With Someone New</h3>

          <div className="space-y-5">
            <div>
              <label className="label-sm text-primary mb-3 block">Who are you sharing with?</label>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { val: 'doctor' as const, label: 'Doctor', icon: <Stethoscope size={20} /> },
                  { val: 'hospital' as const, label: 'Hospital', icon: <Building2 size={20} /> },
                  { val: 'family' as const, label: 'Family', icon: <Heart size={20} /> },
                ]).map((opt) => (
                  <button
                    key={opt.val}
                    onClick={() => setShareType(opt.val)}
                    className={`p-4 rounded-xl text-center transition-all ${
                      shareType === opt.val
                        ? 'bg-surface-container-low ring-2 ring-primary/30'
                        : 'bg-surface-container-high/20 hover:bg-surface-container-high/40'
                    }`}
                  >
                    <div className={`mx-auto mb-2 ${shareType === opt.val ? 'text-primary' : 'text-on-surface-variant/40'}`}>{opt.icon}</div>
                    <p className={`text-sm font-medium ${shareType === opt.val ? 'text-primary' : 'text-on-surface-variant/60'}`}>{opt.label}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-sm text-primary mb-2 block">Name</label>
                <input className="input-vault" placeholder="Full name..." />
              </div>
              <div>
                <label className="label-sm text-primary mb-2 block">Wallet or Email</label>
                <input className="input-vault" placeholder="0x... or email" />
              </div>
            </div>

            <div>
              <label className="label-sm text-primary mb-2 block">Access Duration</label>
              <select className="input-vault">
                <option>24 Hours</option>
                <option>7 Days</option>
                <option>30 Days</option>
                <option>Permanent (until revoked)</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button onClick={addShare} className="btn-primary flex-1 py-3">
                <Send size={14} /> Send Invitation
              </button>
              <button onClick={() => setShowAdd(false)} className="btn-secondary py-3 px-6">
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Current shares */}
      <motion.div {...fadeUp(0.15)}>
        <h2 className="text-sm font-bold text-on-surface font-headline mb-4 flex items-center gap-2">
          <ShieldCheck size={16} className="text-primary" />
          People With Access to My Records
          <span className="label-sm bg-primary/10 text-primary px-2.5 py-1 rounded-full ml-2">
            {shares.length} Active
          </span>
        </h2>

        <div className="space-y-3">
          {shares.map((share, i) => (
            <motion.div
              key={share.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.06 }}
              className="card p-5 flex items-center gap-4"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${TYPE_COLORS[share.type]}`}>
                {TYPE_ICONS[share.type]}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-on-surface">{share.name}</p>
                <p className="text-xs text-on-surface-variant/40 mt-0.5">{share.description}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[0.65rem] text-on-surface-variant/30">
                    Shared since {share.sharedSince}
                  </span>
                  {share.expiresIn ? (
                    <span className="text-[0.65rem] text-[#ffb951] flex items-center gap-1">
                      <Clock size={10} /> Expires in {share.expiresIn}
                    </span>
                  ) : (
                    <span className="text-[0.65rem] text-primary flex items-center gap-1">
                      <ShieldCheck size={10} /> Permanent
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => revoke(share.id)}
                className="flex items-center gap-1.5 text-xs text-tertiary bg-tertiary/10 hover:bg-tertiary hover:text-on-tertiary px-4 py-2.5 rounded-full transition-all"
              >
                <XCircle size={12} />
                Revoke
              </button>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
