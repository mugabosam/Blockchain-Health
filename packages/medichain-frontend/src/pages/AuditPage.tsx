import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ScrollText,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Clock,
  Hash,
  Box,
  ArrowDownUp,
  Download,
} from 'lucide-react'

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4 },
})

type ActionType = 'record_created' | 'access_granted' | 'access_revoked' | 'prescription' | 'vitals_update' | 'emergency_access' | 'role_assigned' | 'record_viewed'

interface AuditRow {
  id: string
  action: ActionType
  label: string
  actor: string
  actorAddress: string
  target: string
  timestamp: string
  txHash: string
  block: number
}

const ACTION_STYLES: Record<ActionType, { bg: string; text: string }> = {
  record_created: { bg: 'bg-primary/10', text: 'text-primary' },
  access_granted: { bg: 'bg-secondary/10', text: 'text-secondary' },
  access_revoked: { bg: 'bg-tertiary/10', text: 'text-tertiary' },
  prescription: { bg: 'bg-[#412d00]', text: 'text-[#ffb951]' },
  vitals_update: { bg: 'bg-primary/10', text: 'text-primary' },
  emergency_access: { bg: 'bg-error-container/30', text: 'text-tertiary' },
  role_assigned: { bg: 'bg-[#2d3449]', text: 'text-[#d0bcff]' },
  record_viewed: { bg: 'bg-surface-variant', text: 'text-on-surface-variant' },
}

const ENTRIES: AuditRow[] = [
  { id: '1', action: 'record_created', label: 'Record Created', actor: 'Dr. Sarah Chen', actorAddress: '0x71C0...4921', target: 'Patient #8821', timestamp: '2026-04-13 14:32:01', txHash: '0xab3f91c2...e4d1', block: 4291003 },
  { id: '2', action: 'access_granted', label: 'Access Granted', actor: 'James Hartwell', actorAddress: '0xF8e2...9A01', target: 'Mayo Clinic', timestamp: '2026-04-13 14:18:44', txHash: '0x7d214e83...b721', block: 4291001 },
  { id: '3', action: 'prescription', label: 'Prescription Issued', actor: 'Dr. Kenji Mori', actorAddress: '0x7C21...D612', target: 'Patient #3392', timestamp: '2026-04-13 14:04:12', txHash: '0x1c94b72a...f103', block: 4290998 },
  { id: '4', action: 'access_revoked', label: 'Access Revoked', actor: 'System', actorAddress: '0x0000...0000', target: 'Expired Grant #441', timestamp: '2026-04-13 13:30:00', txHash: '0xe8f120d5...a892', block: 4290992 },
  { id: '5', action: 'vitals_update', label: 'Vitals Updated', actor: 'Nurse Tanaka', actorAddress: '0x3a9F...B712', target: 'Patient #1102', timestamp: '2026-04-13 13:15:23', txHash: '0x55b3c891...d403', block: 4290988 },
  { id: '6', action: 'emergency_access', label: 'Emergency Break-Glass', actor: 'EMT Override', actorAddress: '0xAA10...FF33', target: 'Patient #7703', timestamp: '2026-04-13 11:02:55', txHash: '0x92d1f304...c219', block: 4290941 },
  { id: '7', action: 'role_assigned', label: 'Role Assigned', actor: 'Admin', actorAddress: '0x71C0...4921', target: 'Sarah Jenkins → Nurse', timestamp: '2026-04-13 10:45:00', txHash: '0xf1e293a1...8bc2', block: 4290935 },
  { id: '8', action: 'record_viewed', label: 'Record Viewed', actor: 'Dr. Sarah Chen', actorAddress: '0x71C0...4921', target: 'Patient #8821 / Lab Result', timestamp: '2026-04-13 10:30:11', txHash: '0xa4b2c8d1...e923', block: 4290930 },
  { id: '9', action: 'record_created', label: 'Record Created', actor: 'Radiology Dept', actorAddress: '0xD4B1...E201', target: 'Patient #1102 / Imaging', timestamp: '2026-04-12 17:22:03', txHash: '0x3c8d1e2a...f412', block: 4290812 },
  { id: '10', action: 'access_granted', label: 'Access Granted', actor: 'Elena Vasquez', actorAddress: '0xD1C8...3E42', target: 'Central Pharmacy', timestamp: '2026-04-12 16:10:44', txHash: '0x8e12f3a4...d821', block: 4290798 },
]

const PAGE_SIZE = 6

export default function AuditPage() {
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<ActionType | 'all'>('all')
  const [page, setPage] = useState(1)
  const [sortAsc, setSortAsc] = useState(false)

  let filtered = ENTRIES.filter((e) => {
    const matchSearch =
      e.actor.toLowerCase().includes(search.toLowerCase()) ||
      e.target.toLowerCase().includes(search.toLowerCase()) ||
      e.txHash.toLowerCase().includes(search.toLowerCase())
    const matchType = filterType === 'all' || e.action === filterType
    return matchSearch && matchType
  })

  if (sortAsc) filtered = [...filtered].reverse()

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="space-y-6">
      <motion.div {...fadeUp(0)}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-on-surface font-headline">Audit Trail</h1>
            <p className="text-sm text-on-surface-variant/50 mt-1">Immutable transaction ledger — every action recorded on-chain</p>
          </div>
          <button className="btn-secondary py-2.5 px-5 text-xs">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div {...fadeUp(0.1)} className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/30" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Search actor, target, or tx hash..." className="input-vault pl-11" />
        </div>
        <select
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value as ActionType | 'all'); setPage(1) }}
          className="input-vault w-auto"
        >
          <option value="all">All Actions</option>
          <option value="record_created">Record Created</option>
          <option value="access_granted">Access Granted</option>
          <option value="access_revoked">Access Revoked</option>
          <option value="prescription">Prescription</option>
          <option value="vitals_update">Vitals Update</option>
          <option value="emergency_access">Emergency</option>
          <option value="role_assigned">Role Assigned</option>
          <option value="record_viewed">Record Viewed</option>
        </select>
        <button
          onClick={() => setSortAsc(!sortAsc)}
          className="btn-secondary py-2.5 px-4 text-xs"
        >
          <ArrowDownUp size={14} /> {sortAsc ? 'Oldest First' : 'Newest First'}
        </button>
      </motion.div>

      {/* Ledger table */}
      <motion.div {...fadeUp(0.15)} className="card overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-surface-container-high/30 text-on-surface-variant/40">
          <span className="col-span-2 label-sm">Action</span>
          <span className="col-span-3 label-sm">Actor</span>
          <span className="col-span-2 label-sm">Target</span>
          <span className="col-span-2 label-sm">Timestamp</span>
          <span className="col-span-2 label-sm">Tx Hash</span>
          <span className="col-span-1 label-sm text-right">Block</span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-outline-variant/[0.06]">
          {paginated.map((entry, i) => {
            const style = ACTION_STYLES[entry.action]
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 + i * 0.04 }}
                className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-surface-container-high/20 transition-colors"
              >
                <div className="col-span-2">
                  <span className={`label-sm px-2.5 py-1 rounded-full whitespace-nowrap ${style.bg} ${style.text}`}>
                    {entry.label}
                  </span>
                </div>
                <div className="col-span-3">
                  <p className="text-sm text-on-surface font-medium truncate">{entry.actor}</p>
                  <p className="text-[0.6rem] font-mono text-on-surface-variant/25">{entry.actorAddress}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-on-surface-variant truncate">{entry.target}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-on-surface-variant/50 font-mono flex items-center gap-1">
                    <Clock size={10} />
                    {entry.timestamp.split(' ')[1]}
                  </p>
                  <p className="text-[0.6rem] text-on-surface-variant/25">{entry.timestamp.split(' ')[0]}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-mono text-on-surface-variant/30 flex items-center gap-1 truncate">
                    <Hash size={10} />
                    {entry.txHash}
                  </p>
                </div>
                <div className="col-span-1 text-right">
                  <p className="text-xs font-mono text-on-surface-variant/40 flex items-center justify-end gap-1">
                    <Box size={10} />
                    {entry.block.toLocaleString()}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 bg-surface-container-high/15">
          <p className="text-xs text-on-surface-variant/30">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} entries
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg text-on-surface-variant/40 hover:text-on-surface hover:bg-surface-container-high/40 transition-all disabled:opacity-25"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                  page === i + 1 ? 'bg-primary/10 text-primary' : 'text-on-surface-variant/40 hover:text-on-surface'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg text-on-surface-variant/40 hover:text-on-surface hover:bg-surface-container-high/40 transition-all disabled:opacity-25"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
