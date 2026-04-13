import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  HeartPulse,
  Thermometer,
  Activity,
  Wind,
  Weight,
  Ruler,
  User,
  Send,
  Clock,
} from 'lucide-react'
import toast from 'react-hot-toast'

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4 },
})

const VITAL_FIELDS = [
  { key: 'bpSystolic', label: 'Systolic BP', unit: 'mmHg', icon: <Activity size={18} />, placeholder: '120', color: 'primary' },
  { key: 'bpDiastolic', label: 'Diastolic BP', unit: 'mmHg', icon: <Activity size={18} />, placeholder: '80', color: 'primary' },
  { key: 'heartRate', label: 'Heart Rate', unit: 'bpm', icon: <HeartPulse size={18} />, placeholder: '72', color: 'tertiary' },
  { key: 'temperature', label: 'Temperature', unit: '°C', icon: <Thermometer size={18} />, placeholder: '36.6', color: 'secondary' },
  { key: 'spO2', label: 'SpO2', unit: '%', icon: <Wind size={18} />, placeholder: '98', color: 'primary' },
  { key: 'weight', label: 'Weight', unit: 'kg', icon: <Weight size={18} />, placeholder: '72.5', color: 'secondary' },
  { key: 'height', label: 'Height', unit: 'cm', icon: <Ruler size={18} />, placeholder: '175', color: 'secondary' },
]

const RECENT_ENTRIES = [
  { patient: 'James Hartwell', id: 'P-8821', time: '14:32', bp: '120/80', hr: 72, temp: 36.6, spo2: 98 },
  { patient: 'Robert Kim', id: 'P-1102', time: '13:15', bp: '135/88', hr: 84, temp: 37.1, spo2: 96 },
  { patient: 'Elena Vasquez', id: 'P-7703', time: '11:45', bp: '118/76', hr: 68, temp: 36.4, spo2: 99 },
]

export default function NursePage() {
  const [patientId, setPatientId] = useState('')
  const [vitals, setVitals] = useState<Record<string, string>>({})

  const handleSubmit = () => {
    if (!patientId) { toast.error('Select a patient first'); return }
    toast.success('Vital signs recorded on-chain')
    setVitals({})
    setPatientId('')
  }

  return (
    <div className="space-y-6">
      <motion.div {...fadeUp(0)}>
        <h1 className="text-2xl font-extrabold text-on-surface font-headline">Nurse Station</h1>
        <p className="text-sm text-on-surface-variant/50 mt-1">Record patient vital signs with blockchain-verified timestamps</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Vitals Entry Form */}
        <motion.div {...fadeUp(0.1)} className="lg:col-span-8 card p-6">
          <h2 className="text-sm font-bold text-on-surface font-headline mb-6 flex items-center gap-2">
            <HeartPulse size={16} className="text-primary" />
            Record Vital Signs
          </h2>

          {/* Patient selector */}
          <div className="mb-6">
            <label className="label-sm text-primary mb-2 block">Patient</label>
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="input-vault"
            >
              <option value="">Select patient...</option>
              <option value="P-8821">James Hartwell (P-8821)</option>
              <option value="P-3392">Maria Santos (P-3392)</option>
              <option value="P-1102">Robert Kim (P-1102)</option>
              <option value="P-7703">Elena Vasquez (P-7703)</option>
            </select>
          </div>

          {/* Vital signs grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {VITAL_FIELDS.map((field, i) => (
              <motion.div
                key={field.key}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                className="bg-surface-container-high/20 rounded-xl p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className={field.color === 'primary' ? 'text-primary' : field.color === 'tertiary' ? 'text-tertiary' : 'text-secondary'}>
                    {field.icon}
                  </span>
                  <label className="label-sm text-on-surface-variant/60">{field.label}</label>
                </div>
                <div className="flex items-end gap-2">
                  <input
                    value={vitals[field.key] || ''}
                    onChange={(e) => setVitals({ ...vitals, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    className="input-vault text-xl font-bold font-headline p-2 bg-surface-container-lowest"
                    type="number"
                  />
                  <span className="text-xs text-on-surface-variant/30 pb-2">{field.unit}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="label-sm text-primary mb-2 block">Clinical Notes</label>
            <textarea rows={3} className="input-vault resize-none" placeholder="Additional observations..." />
          </div>

          <button onClick={handleSubmit} className="btn-primary w-full py-4">
            <Send size={16} />
            Record Vitals to Blockchain
          </button>
        </motion.div>

        {/* Recent entries */}
        <motion.div {...fadeUp(0.2)} className="lg:col-span-4 card p-6">
          <h3 className="text-sm font-bold text-on-surface font-headline mb-5 flex items-center gap-2">
            <Clock size={16} className="text-secondary" />
            Recent Entries
          </h3>

          <div className="space-y-3">
            {RECENT_ENTRIES.map((entry, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="p-4 rounded-xl bg-surface-container-high/20"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-on-surface">{entry.patient}</p>
                  <span className="text-[0.6rem] font-mono text-on-surface-variant/30">{entry.time}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Activity size={11} className="text-primary" />
                    <span className="text-on-surface-variant/50">BP: <span className="text-on-surface font-medium">{entry.bp}</span></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <HeartPulse size={11} className="text-tertiary" />
                    <span className="text-on-surface-variant/50">HR: <span className="text-on-surface font-medium">{entry.hr}</span></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Thermometer size={11} className="text-secondary" />
                    <span className="text-on-surface-variant/50">Temp: <span className="text-on-surface font-medium">{entry.temp}°</span></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Wind size={11} className="text-primary" />
                    <span className="text-on-surface-variant/50">SpO2: <span className="text-on-surface font-medium">{entry.spo2}%</span></span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
