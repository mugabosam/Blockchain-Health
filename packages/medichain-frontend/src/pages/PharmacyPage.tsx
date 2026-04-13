import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Pill,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Package,
  Send,
} from 'lucide-react'
import toast from 'react-hot-toast'

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4 },
})

interface PrescriptionItem {
  id: string
  patient: string
  patientId: string
  medication: string
  dosage: string
  frequency: string
  prescribedBy: string
  prescribedAt: string
  status: 'pending' | 'dispensed' | 'expired'
  urgency: 'routine' | 'urgent'
}

const PRESCRIPTIONS: PrescriptionItem[] = [
  { id: 'RX-4412', patient: 'James Hartwell', patientId: 'P-8821', medication: 'Lisinopril', dosage: '10mg', frequency: 'Once daily', prescribedBy: 'Dr. Sarah Chen', prescribedAt: 'Apr 10, 2026', status: 'pending', urgency: 'routine' },
  { id: 'RX-4413', patient: 'Robert Kim', patientId: 'P-1102', medication: 'Amoxicillin', dosage: '500mg', frequency: 'Three times daily', prescribedBy: 'Dr. Kenji Mori', prescribedAt: 'Apr 10, 2026', status: 'pending', urgency: 'urgent' },
  { id: 'RX-4410', patient: 'Elena Vasquez', patientId: 'P-7703', medication: 'Metformin', dosage: '500mg', frequency: 'Twice daily', prescribedBy: 'Dr. Sarah Chen', prescribedAt: 'Apr 8, 2026', status: 'dispensed', urgency: 'routine' },
  { id: 'RX-4408', patient: 'Maria Santos', patientId: 'P-3392', medication: 'Prenatal Vitamins', dosage: '1 tablet', frequency: 'Once daily', prescribedBy: 'Dr. Kenji Mori', prescribedAt: 'Apr 5, 2026', status: 'dispensed', urgency: 'routine' },
]

export default function PharmacyPage() {
  const [prescriptions, setPrescriptions] = useState(PRESCRIPTIONS)
  const [filter, setFilter] = useState<'all' | 'pending' | 'dispensed'>('all')
  const [search, setSearch] = useState('')

  const filtered = prescriptions.filter((p) => {
    const matchesFilter = filter === 'all' || p.status === filter
    const matchesSearch = p.patient.toLowerCase().includes(search.toLowerCase()) || p.medication.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const dispense = (id: string) => {
    setPrescriptions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'dispensed' as const } : p))
    )
    toast.success('Prescription dispensed & recorded on-chain')
  }

  const pendingCount = prescriptions.filter((p) => p.status === 'pending').length

  return (
    <div className="space-y-6">
      <motion.div {...fadeUp(0)}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-on-surface font-headline">Pharmacy Portal</h1>
            <p className="text-sm text-on-surface-variant/50 mt-1">Verify and dispense blockchain-authenticated prescriptions</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="label-sm bg-[#412d00] text-[#ffb951] px-3 py-1.5 rounded-full">
              {pendingCount} Pending
            </span>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div {...fadeUp(0.1)} className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/30" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search prescriptions..." className="input-vault pl-11" />
        </div>
        <div className="flex gap-1 bg-surface-container-high/30 p-1 rounded-xl">
          {(['all', 'pending', 'dispensed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                filter === f ? 'bg-surface-container-low text-primary' : 'text-on-surface-variant/50 hover:text-on-surface'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Prescription cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <AnimatePresence mode="popLayout">
          {filtered.map((rx, i) => (
            <motion.div
              key={rx.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05 }}
              className={`card p-6 relative overflow-hidden ${rx.urgency === 'urgent' && rx.status === 'pending' ? 'ring-1 ring-tertiary/30' : ''}`}
            >
              {rx.urgency === 'urgent' && rx.status === 'pending' && (
                <div className="absolute top-0 left-0 w-full h-0.5 bg-tertiary" />
              )}

              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Pill size={16} className="text-[#ffb951]" />
                    <h3 className="text-base font-bold text-on-surface font-headline">{rx.medication}</h3>
                  </div>
                  <p className="text-xs text-on-surface-variant/40">{rx.dosage} · {rx.frequency}</p>
                </div>
                <span className={`label-sm px-2.5 py-1 rounded-full ${
                  rx.status === 'pending' ? 'bg-[#412d00] text-[#ffb951]' : 'bg-primary/10 text-primary'
                }`}>
                  {rx.status === 'pending' ? (
                    <span className="flex items-center gap-1"><Clock size={10} /> Pending</span>
                  ) : (
                    <span className="flex items-center gap-1"><CheckCircle size={10} /> Dispensed</span>
                  )}
                </span>
              </div>

              <div className="space-y-2 mb-5">
                <div className="flex items-center gap-2 text-sm">
                  <User size={13} className="text-on-surface-variant/30" />
                  <span className="text-on-surface-variant/60">Patient:</span>
                  <span className="text-on-surface font-medium">{rx.patient}</span>
                  <span className="text-[0.6rem] font-mono text-on-surface-variant/25">{rx.patientId}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Package size={13} className="text-on-surface-variant/30" />
                  <span className="text-on-surface-variant/60">Prescribed by:</span>
                  <span className="text-on-surface">{rx.prescribedBy}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock size={13} className="text-on-surface-variant/30" />
                  <span className="text-on-surface-variant/60">Date:</span>
                  <span className="text-on-surface">{rx.prescribedAt}</span>
                </div>
              </div>

              {rx.urgency === 'urgent' && rx.status === 'pending' && (
                <div className="flex items-center gap-2 p-3 bg-tertiary/10 rounded-lg mb-4">
                  <AlertCircle size={14} className="text-tertiary shrink-0" />
                  <p className="text-xs text-tertiary">Urgent prescription — priority dispensing required</p>
                </div>
              )}

              {rx.status === 'pending' && (
                <button onClick={() => dispense(rx.id)} className="btn-primary w-full py-3">
                  <Send size={14} />
                  Verify & Dispense
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
