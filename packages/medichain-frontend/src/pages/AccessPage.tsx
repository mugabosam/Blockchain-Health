import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Lock,
  UserPlus,
  UserMinus,
  Clock,
  ShieldCheck,
  ShieldOff,
  Info,
  Fingerprint,
  Eye,
  Zap,
  Scroll,
  Send,
  XCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4 },
})

interface Grant {
  id: string
  entity: string
  address: string
  role: string
  expiresIn: string
  isPersistent: boolean
}

const INITIAL_GRANTS: Grant[] = [
  { id: '1', entity: 'Mayo Clinic (Oncology Dept)', address: '0x8a2...F491', role: 'Consulting Physician', expiresIn: '14h 22m', isPersistent: false },
  { id: '2', entity: 'Metropolis General ER', address: '0x221...A011', role: 'Emergency Access', expiresIn: '', isPersistent: true },
  { id: '3', entity: 'Dr. Kenji Mori', address: '0x7C21...D612', role: 'Referring Physician', expiresIn: '6 days', isPersistent: false },
  { id: '4', entity: 'Central Pharmacy', address: '0xB3F1...2C09', role: 'Pharmacist', expiresIn: '29 days', isPersistent: false },
]

const DURATIONS = ['24h', '7 Days', '30 Days']
const ROLES = ['Consulting Physician', 'Referring Physician', 'Pharmacist', 'Nurse', 'Emergency Access', 'Data Auditor']

export default function AccessPage() {
  const [tab, setTab] = useState<'grant' | 'revoke'>('grant')
  const [grants, setGrants] = useState(INITIAL_GRANTS)
  const [selectedDuration, setSelectedDuration] = useState('24h')
  const [walletAddress, setWalletAddress] = useState('')
  const [selectedRole, setSelectedRole] = useState(ROLES[0])

  const handleGrant = () => {
    if (!walletAddress) { toast.error('Enter a wallet address'); return }
    toast.success('Access grant initialized on-chain')
    setWalletAddress('')
  }

  const handleRevoke = (id: string) => {
    setGrants((prev) => prev.filter((g) => g.id !== id))
    toast.success('Access revoked and recorded on-chain')
  }

  return (
    <div className="space-y-6">
      <motion.div {...fadeUp(0)}>
        <h1 className="text-2xl font-extrabold text-on-surface font-headline">Vault Access Control</h1>
        <p className="text-sm text-on-surface-variant/50 mt-1">
          Manage cryptographic permissions for your clinical data. All changes are immutable and recorded on the ledger.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Grant/Revoke form */}
        <motion.div {...fadeUp(0.1)} className="lg:col-span-7 space-y-6">
          {/* Tab switcher */}
          <div className="flex gap-1 bg-surface-container-high/30 p-1 rounded-xl w-fit">
            <button
              onClick={() => setTab('grant')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === 'grant' ? 'bg-surface-container-low text-primary' : 'text-on-surface-variant/50'
              }`}
            >
              <UserPlus size={16} /> Grant Access
            </button>
            <button
              onClick={() => setTab('revoke')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === 'revoke' ? 'bg-surface-container-low text-primary' : 'text-on-surface-variant/50'
              }`}
            >
              <UserMinus size={16} /> Revoke Access
            </button>
          </div>

          {/* New Permission Grant form */}
          <div className="card p-6">
            <h2 className="text-lg font-bold text-on-surface font-headline mb-1">New Permission Grant</h2>
            <p className="text-sm text-on-surface-variant/40 mb-6">Configure temporary access for a verified medical professional.</p>

            <div className="space-y-5">
              <div>
                <label className="label-sm text-primary mb-2 block">Provider Wallet Address</label>
                <div className="relative">
                  <Fingerprint size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/30" />
                  <input
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    className="input-vault pl-11 font-mono"
                    placeholder="0x... or ENS name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="label-sm text-primary mb-2 block">Role Permission</label>
                  <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="input-vault">
                    {ROLES.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-sm text-primary mb-2 block">Grant Duration</label>
                  <div className="flex gap-2">
                    {DURATIONS.map((d) => (
                      <button
                        key={d}
                        onClick={() => setSelectedDuration(d)}
                        className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${
                          selectedDuration === d
                            ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
                            : 'bg-surface-container-high/30 text-on-surface-variant/50 hover:text-on-surface'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button onClick={handleGrant} className="btn-primary w-full py-4">
                <Lock size={16} />
                Initialize Secure Grant
              </button>

              <div className="flex items-center gap-2 text-[0.65rem] text-on-surface-variant/30 justify-center">
                <ShieldCheck size={12} />
                Action requires biometric signature from your hardware wallet.
              </div>
            </div>
          </div>

          {/* Active Grants */}
          <div className="card overflow-hidden">
            <div className="p-6 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-on-surface font-headline">Active Access Grants</h2>
                <p className="text-xs text-on-surface-variant/40 mt-0.5">Entities currently holding cryptographic keys to your vault.</p>
              </div>
              <span className="label-sm bg-primary/10 text-primary px-3 py-1 rounded-full">
                {grants.length} Active Grants
              </span>
            </div>

            <div className="px-6 pb-6 space-y-3">
              {grants.map((grant, i) => (
                <motion.div
                  key={grant.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.06 }}
                  className="flex items-center gap-4 p-4 rounded-xl bg-surface-container-high/20"
                >
                  <div className="w-10 h-10 rounded-xl bg-secondary-container/20 flex items-center justify-center shrink-0">
                    <ShieldCheck size={18} className="text-secondary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-on-surface">{grant.entity}</p>
                    <p className="text-[0.6rem] font-mono text-on-surface-variant/30">{grant.address}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[0.65rem] text-on-surface-variant/40">{grant.role}</span>
                      <span className="text-[0.65rem] text-on-surface-variant/25">·</span>
                      <span className={`text-[0.65rem] ${grant.isPersistent ? 'text-secondary' : 'text-on-surface-variant/40'}`}>
                        {grant.isPersistent ? 'Persistent Access' : `Expires in ${grant.expiresIn}`}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRevoke(grant.id)}
                    className="flex items-center gap-1.5 text-xs text-tertiary bg-tertiary/10 hover:bg-tertiary hover:text-on-tertiary px-3 py-2 rounded-full transition-all"
                  >
                    <XCircle size={12} />
                    Revoke Now
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Right sidebar - Info panel */}
        <motion.div {...fadeUp(0.2)} className="lg:col-span-5 space-y-6">
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck size={20} className="text-primary" />
              <h3 className="text-lg font-bold text-on-surface font-headline">Time-Limited Medical Sovereignty</h3>
            </div>

            <div className="space-y-5">
              {[
                {
                  icon: <Clock size={16} />,
                  title: 'Auto-Expiration',
                  desc: 'Access keys automatically self-destruct after the chosen duration, ensuring no permanent backdoors exist.',
                },
                {
                  icon: <Eye size={16} />,
                  title: 'Zero-Knowledge Proofs',
                  desc: 'MediChain uses ZKPs to verify provider credentials without exposing their entire identity or private keys.',
                },
                {
                  icon: <Scroll size={16} />,
                  title: 'Immutable Evidence',
                  desc: 'Every grant and revocation is logged as an on-chain transaction for a legally admissible audit trail.',
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex gap-3"
                >
                  <div className="p-2 rounded-lg bg-primary/10 text-primary h-fit shrink-0">{item.icon}</div>
                  <div>
                    <p className="text-sm font-bold text-on-surface">{item.title}</p>
                    <p className="text-xs text-on-surface-variant/40 mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Security score */}
          <div className="card p-6">
            <h3 className="text-sm font-bold text-on-surface font-headline mb-4">Network Security Score</h3>
            <div className="flex items-end gap-3 mb-3">
              <span className="text-4xl font-extrabold text-primary font-headline">94</span>
              <span className="text-on-surface-variant/40 text-sm mb-1">/100</span>
            </div>
            <div className="w-full bg-surface-container-lowest h-2.5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '94%' }}
                transition={{ delay: 0.6, duration: 1.0, ease: 'easeOut' }}
                className="bg-gradient-to-r from-primary to-primary-container h-full rounded-full"
              />
            </div>
            <p className="text-[0.65rem] text-on-surface-variant/30 mt-3 italic">
              The security score reflects the strength of your current encryption rotation and permission hygiene.
            </p>
          </div>

          {/* Emergency Assistance */}
          <div className="card p-6 text-center">
            <h3 className="text-sm font-bold text-on-surface font-headline mb-3">Emergency Assistance</h3>
            <button className="btn-primary py-3 px-6 mx-auto">
              <Zap size={14} />
              Contact Security Lead
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
