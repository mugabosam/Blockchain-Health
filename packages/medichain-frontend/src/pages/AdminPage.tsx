import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ShieldCheck,
  UserPlus,
  Skull,
  Pause,
  Play,
  Server,
  Zap,
  Lock,
  AlertTriangle,
  CheckCircle,
  Send,
  Users,
} from 'lucide-react'
import toast from 'react-hot-toast'

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4 },
})

const MEDICAL_ROLES = ['Chief Surgeon', 'Attending Physician', 'Registered Nurse', 'Pharmacist', 'Data Auditor', 'Researcher']

export default function AdminPage() {
  const [isPaused, setIsPaused] = useState(false)
  const [deathConfirm, setDeathConfirm] = useState(false)

  return (
    <div className="space-y-6">
      <motion.div {...fadeUp(0)}>
        <h1 className="text-2xl font-extrabold text-on-surface font-headline">Security Settings</h1>
        <p className="text-sm text-on-surface-variant/50 mt-1">System administration, staff management, and emergency protocols</p>
      </motion.div>

      {/* Global Protocol State */}
      <motion.div {...fadeUp(0.08)} className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-on-surface font-headline">Global Protocol State</h2>
            <p className="text-sm text-on-surface-variant/40 mt-0.5">Emergency override controls for the entire MediChain ecosystem.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setIsPaused(true); toast.error('All operations paused') }}
              disabled={isPaused}
              className="btn-danger py-3 px-6 text-sm disabled:opacity-30"
            >
              <Pause size={16} /> PAUSE ALL OPERATIONS
            </button>
            <button
              onClick={() => { setIsPaused(false); toast.success('Protocols resumed') }}
              disabled={!isPaused}
              className="btn-primary py-3 px-6 text-sm disabled:opacity-30"
            >
              <Play size={16} /> RESUME PROTOCOLS
            </button>
          </div>
        </div>
        {isPaused && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 p-4 bg-tertiary/10 rounded-xl flex items-center gap-3"
          >
            <AlertTriangle size={18} className="text-tertiary shrink-0" />
            <p className="text-sm text-tertiary">System is currently paused. No new records or transactions can be committed.</p>
          </motion.div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Staff Registration */}
        <motion.div {...fadeUp(0.15)} className="lg:col-span-7 card overflow-hidden">
          <div className="p-6 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <UserPlus size={18} className="text-primary" />
              <h3 className="text-lg font-bold text-on-surface font-headline">Staff Registration</h3>
            </div>
            <p className="text-sm text-on-surface-variant/40">Onboard new personnel by linking their biometric-secured wallet addresses.</p>
          </div>

          <div className="p-6 pt-2 space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="label-sm text-primary mb-2 block">Full Legal Name</label>
                <input className="input-vault" placeholder="Dr. Julian Thorne" />
              </div>
              <div>
                <label className="label-sm text-primary mb-2 block">Assign Medical Role</label>
                <select className="input-vault">
                  {MEDICAL_ROLES.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label-sm text-primary mb-2 block">Wallet Address (ENS or 0x...)</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/30" />
                <input className="input-vault pl-11 font-mono" placeholder="0x..." />
              </div>
            </div>
            <button onClick={() => toast.success('Staff member registered on-chain')} className="btn-primary w-full py-4">
              Authorize New Record Access
            </button>
          </div>

          {/* Pending approvals */}
          <div className="p-6 bg-surface-container-high/15">
            <h4 className="label-sm text-on-surface-variant/40 mb-4">Pending Approvals</h4>
            <div className="space-y-2">
              {[
                { name: 'Sarah Jenkins, RN', address: '0x8a2...3f1c' },
                { name: 'Dr. Marcus Webb', address: '0x92D1...C403' },
              ].map((p, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-surface-container-lowest">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary-container/20 flex items-center justify-center">
                      <Users size={14} className="text-secondary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-on-surface">{p.name}</p>
                      <p className="text-[0.6rem] font-mono text-on-surface-variant/25">{p.address}</p>
                    </div>
                  </div>
                  <button className="label-sm bg-secondary/10 text-secondary px-3 py-1.5 rounded-full hover:bg-secondary hover:text-on-secondary transition-all">
                    Verify Biometrics
                  </button>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Death Protocol + Node Status */}
        <motion.div {...fadeUp(0.2)} className="lg:col-span-5 space-y-6">
          {/* Death Protocol */}
          <div className="card overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-tertiary" />
            <div className="p-6">
              <div className="flex items-center gap-2 mb-1">
                <Skull size={18} className="text-tertiary" />
                <h3 className="text-lg font-bold text-on-surface font-headline">Death Protocol Activation</h3>
              </div>
              <p className="text-sm text-on-surface-variant/40 mb-5">Designate the immutable executor address for asset and record distribution.</p>

              <div className="p-4 bg-tertiary/10 rounded-xl mb-5">
                <p className="text-xs text-tertiary leading-relaxed">
                  <strong>Warning:</strong> This action triggers a smart-contract level lock. Once an executor is confirmed, record ownership will auto-transfer upon verification of certificate hash.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="label-sm text-tertiary mb-2 block">Patient Record Hash</label>
                  <input className="input-vault focus:ring-tertiary/30" placeholder="UUID-8821-992-X" />
                </div>
                <div>
                  <label className="label-sm text-tertiary mb-2 block">Designated Executor Wallet</label>
                  <input className="input-vault font-mono focus:ring-tertiary/30" placeholder="0x..." />
                </div>

                <div className="flex items-start gap-3 py-2">
                  <input
                    type="checkbox"
                    checked={deathConfirm}
                    onChange={(e) => setDeathConfirm(e.target.checked)}
                    className="mt-1 rounded bg-surface-container-lowest accent-tertiary"
                  />
                  <label className="text-xs text-on-surface-variant/50 leading-tight">
                    I confirm that I have verified the legal identity of the executor and have double-checked the destination address.
                  </label>
                </div>

                <button
                  disabled={!deathConfirm}
                  onClick={() => toast.success('Distributed custody initiated')}
                  className="btn-danger w-full py-4 disabled:opacity-30"
                >
                  Initiate Distributed Custody
                </button>
              </div>
            </div>
          </div>

          {/* Node Status */}
          <div className="card p-6">
            <h4 className="label-sm text-on-surface-variant/40 mb-5">Real-Time Node Status</h4>
            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-on-surface-variant/60">Validation Nodes</span>
                  <span className="text-primary font-mono font-semibold">99.98% Active</span>
                </div>
                <div className="w-full bg-surface-container-lowest h-2 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '99.98%' }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className="bg-gradient-to-r from-primary to-primary-container h-full rounded-full shadow-[0_0_8px_rgba(78,222,163,0.5)]"
                  />
                </div>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant/60">Consensus Latency</span>
                <span className="text-secondary font-mono">12ms</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant/60">Encryption Layer</span>
                <span className="text-primary font-mono">AES-256 Poly</span>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-outline-variant/[0.08] flex items-center justify-between">
              <div className="flex -space-x-2">
                {['S', 'K', 'A'].map((l, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-[10px] font-bold text-on-surface border-2 border-surface-container-low">
                    {l}
                  </div>
                ))}
                <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-[10px] font-bold text-on-surface-variant/50 border-2 border-surface-container-low">
                  +12
                </div>
              </div>
              <span className="text-[0.65rem] text-on-surface-variant/30">System Admins Online</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
