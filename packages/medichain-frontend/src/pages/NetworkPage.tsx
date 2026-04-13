import { motion } from 'framer-motion'
import { Network, Server, Globe, Zap, Shield } from 'lucide-react'

export default function NetworkPage() {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-extrabold text-on-surface font-headline">Medical Network</h1>
        <p className="text-sm text-on-surface-variant/50 mt-1">Connected healthcare institutions and validator nodes</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { icon: <Server size={24} />, label: 'Validator Nodes', value: '128', sub: '99.98% uptime' },
          { icon: <Globe size={24} />, label: 'Connected Hospitals', value: '34', sub: 'Across 12 regions' },
          { icon: <Shield size={24} />, label: 'Consensus Protocol', value: 'PoA', sub: 'Polygon Amoy' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.08 }}
            className="card p-6"
          >
            <div className="text-primary mb-4">{stat.icon}</div>
            <p className="text-2xl font-extrabold text-on-surface font-headline">{stat.value}</p>
            <p className="text-xs text-on-surface-variant/50 mt-1">{stat.label}</p>
            <p className="text-[0.65rem] text-on-surface-variant/30 mt-0.5">{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card p-12 text-center"
      >
        <Network size={48} className="text-on-surface-variant/15 mx-auto mb-4" />
        <p className="text-on-surface-variant/40 text-sm">Network topology visualization coming in Phase 2</p>
      </motion.div>
    </div>
  )
}
