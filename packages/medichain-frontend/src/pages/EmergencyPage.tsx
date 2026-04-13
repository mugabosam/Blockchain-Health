import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  ShieldAlert,
  Clock,
  Fingerprint,
  Zap,
  FileWarning,
  Radio,
  Send,
  XCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4 },
})

function CountdownTimer({ seconds: initialSeconds }: { seconds: number }) {
  const [seconds, setSeconds] = useState(initialSeconds)

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((s) => (s > 0 ? s - 1 : 0))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  const pad = (n: number) => n.toString().padStart(2, '0')
  const pct = ((initialSeconds - seconds) / initialSeconds) * 100

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-2">
        {[
          { val: pad(hours), label: 'HRS' },
          { val: pad(mins), label: 'MIN' },
          { val: pad(secs), label: 'SEC' },
        ].map((unit, i) => (
          <div key={i} className="flex items-center gap-2">
            {i > 0 && <span className="text-tertiary/40 text-2xl font-light">:</span>}
            <div className="text-center">
              <div className="bg-surface-container-lowest rounded-xl px-5 py-3">
                <span className="text-3xl font-extrabold text-tertiary font-headline font-mono tracking-wider">
                  {unit.val}
                </span>
              </div>
              <span className="label-sm text-on-surface-variant/30 mt-1 block">{unit.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="w-full bg-surface-container-lowest h-1.5 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-tertiary to-error-container rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  )
}

export default function EmergencyPage() {
  const [isActivated, setIsActivated] = useState(false)
  const [confirmPhrase, setConfirmPhrase] = useState('')
  const [patientId, setPatientId] = useState('')
  const [reason, setReason] = useState('')

  const REQUIRED_PHRASE = 'BREAK GLASS'

  const handleActivate = () => {
    if (confirmPhrase !== REQUIRED_PHRASE) {
      toast.error(`Type "${REQUIRED_PHRASE}" to confirm`)
      return
    }
    if (!patientId) {
      toast.error('Enter patient ID')
      return
    }
    setIsActivated(true)
    toast.success('Emergency access activated — 24h window open')
  }

  const handleDeactivate = () => {
    setIsActivated(false)
    setConfirmPhrase('')
    toast.success('Emergency access revoked')
  }

  return (
    <div className="space-y-6">
      <motion.div {...fadeUp(0)}>
        <h1 className="text-2xl font-extrabold text-on-surface font-headline flex items-center gap-3">
          <ShieldAlert size={28} className="text-tertiary" />
          Emergency Break-Glass Protocol
        </h1>
        <p className="text-sm text-on-surface-variant/50 mt-1">
          Override standard access controls for life-threatening emergencies. All actions are immutably logged.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main panel */}
        <motion.div {...fadeUp(0.1)} className="lg:col-span-7 space-y-6">
          <AnimatePresence mode="wait">
            {!isActivated ? (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="card overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-tertiary to-error-container" />

                <div className="p-6">
                  <div className="p-4 bg-tertiary/10 rounded-xl mb-6 flex items-start gap-3">
                    <AlertTriangle size={18} className="text-tertiary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-tertiary mb-1">Critical Action</p>
                      <p className="text-xs text-tertiary/70 leading-relaxed">
                        This protocol grants unrestricted access to a patient's encrypted medical records for 24 hours.
                        The break-glass event is permanently recorded on the blockchain and triggers an immediate notification
                        to the patient, their designated contacts, and the compliance team.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="label-sm text-tertiary mb-2 block">Patient ID or Record Hash</label>
                      <input
                        value={patientId}
                        onChange={(e) => setPatientId(e.target.value)}
                        className="input-vault focus:ring-tertiary/30"
                        placeholder="P-8821 or UUID-..."
                      />
                    </div>

                    <div>
                      <label className="label-sm text-tertiary mb-2 block">Emergency Reason</label>
                      <select
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="input-vault focus:ring-tertiary/30"
                      >
                        <option value="">Select reason...</option>
                        <option>Life-Threatening Emergency</option>
                        <option>Unconscious Patient — No Consent Possible</option>
                        <option>Critical Drug Interaction Check</option>
                        <option>Mass Casualty Event</option>
                        <option>Court-Ordered Disclosure</option>
                      </select>
                    </div>

                    <div>
                      <label className="label-sm text-tertiary mb-2 block">Additional Notes</label>
                      <textarea rows={3} className="input-vault resize-none focus:ring-tertiary/30" placeholder="Describe the emergency situation..." />
                    </div>

                    <div>
                      <label className="label-sm text-tertiary mb-2 block">
                        Type "{REQUIRED_PHRASE}" to confirm
                      </label>
                      <input
                        value={confirmPhrase}
                        onChange={(e) => setConfirmPhrase(e.target.value.toUpperCase())}
                        className="input-vault font-mono text-tertiary focus:ring-tertiary/30 text-center text-lg tracking-widest"
                        placeholder={REQUIRED_PHRASE}
                      />
                    </div>

                    <button
                      onClick={handleActivate}
                      disabled={confirmPhrase !== REQUIRED_PHRASE || !patientId}
                      className="btn-danger w-full py-4 text-base disabled:opacity-30"
                    >
                      <Zap size={18} />
                      Activate Emergency Access
                    </button>

                    <div className="flex items-center gap-2 justify-center text-[0.65rem] text-on-surface-variant/30">
                      <Fingerprint size={12} />
                      Requires biometric verification from your hardware wallet
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="active" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="card overflow-hidden relative glow-tertiary">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-tertiary to-error-container" />

                <div className="p-8 text-center">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-16 h-16 rounded-full bg-tertiary/20 flex items-center justify-center mx-auto mb-6"
                  >
                    <ShieldAlert size={32} className="text-tertiary" />
                  </motion.div>

                  <h2 className="text-xl font-extrabold text-tertiary font-headline mb-2">
                    EMERGENCY ACCESS ACTIVE
                  </h2>
                  <p className="text-sm text-on-surface-variant/50 mb-6">
                    Patient {patientId} · All records decrypted · Audit logging active
                  </p>

                  <CountdownTimer seconds={24 * 60 * 60} />

                  <div className="mt-8">
                    <button onClick={handleDeactivate} className="btn-danger py-3 px-8">
                      <XCircle size={16} />
                      Revoke Emergency Access
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Right panel - Protocol info */}
        <motion.div {...fadeUp(0.2)} className="lg:col-span-5 space-y-6">
          <div className="card p-6">
            <h3 className="text-sm font-bold text-on-surface font-headline mb-5 flex items-center gap-2">
              <FileWarning size={16} className="text-tertiary" />
              Break-Glass Protocol Rules
            </h3>

            <div className="space-y-4">
              {[
                { title: '24-Hour Window', desc: 'Emergency access automatically expires after exactly 24 hours. No extensions are possible without a new break-glass event.' },
                { title: 'Full Audit Trail', desc: 'Every record accessed, every action taken during the emergency window is immutably logged with timestamps and wallet signatures.' },
                { title: 'Patient Notification', desc: 'The patient and their designated emergency contacts are immediately notified of the break-glass event.' },
                { title: 'Compliance Review', desc: 'A mandatory compliance review is triggered within 48 hours of every break-glass activation.' },
              ].map((rule, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  className="p-4 bg-surface-container-high/20 rounded-xl"
                >
                  <p className="text-sm font-semibold text-on-surface mb-1">{rule.title}</p>
                  <p className="text-xs text-on-surface-variant/40 leading-relaxed">{rule.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-sm font-bold text-on-surface font-headline mb-4 flex items-center gap-2">
              <Radio size={16} className="text-secondary" />
              Recent Emergency Events
            </h3>
            <div className="space-y-3">
              {[
                { patient: 'P-7703', by: 'EMT Override', time: '3h ago', reason: 'Life-Threatening' },
                { patient: 'P-2201', by: 'Dr. Chen', time: '2 days ago', reason: 'Unconscious Patient' },
              ].map((evt, i) => (
                <div key={i} className="p-3 rounded-xl bg-surface-container-high/20 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-on-surface font-medium">{evt.patient}</p>
                    <p className="text-[0.6rem] text-on-surface-variant/30">{evt.by} · {evt.reason}</p>
                  </div>
                  <span className="text-[0.6rem] font-mono text-on-surface-variant/25">{evt.time}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
