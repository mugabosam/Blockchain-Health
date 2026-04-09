import { useState, useEffect } from "react";
import { useWeb3 } from "../contexts/Web3Context";
import { useRecords } from "../hooks/useRecords";
import { useAdmin } from "../hooks/useAdmin";
import type { MedicalRecord, ActiveView } from "../types";
import { RecordTypeLabels } from "../types";

export default function DashboardPage({ onNavigate }: { onNavigate: (v: ActiveView) => void }) {
  const { account, userRole } = useWeb3();
  const { fetchRecords } = useRecords();
  const { getRecordCount, getAuditSize } = useAdmin();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [totalGlobal, setTotalGlobal] = useState(0);
  const [auditSize, setAuditSize] = useState(0);

  useEffect(() => {
    if (!account) return;
    fetchRecords(account).then(setRecords);
    getRecordCount().then(setTotalGlobal);
    getAuditSize().then(setAuditSize);
  }, [account]);

  const stats = [
    { label: "My Records", value: records.length, color: "bg-blue-500", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
    { label: "System Records", value: totalGlobal, color: "bg-emerald-500", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
    { label: "Audit Events", value: auditSize, color: "bg-violet-500", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
    { label: "Security", value: "Active", color: "bg-teal-500", icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z", isText: true },
  ];

  const quickActions = [
    { label: "Add Record", desc: "Create a new medical record", view: "records" as ActiveView, color: "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100" },
    { label: "Manage Access", desc: "Grant or revoke record access", view: "access" as ActiveView, color: "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100" },
    { label: "Prescriptions", desc: "Write or view prescriptions", view: "prescriptions" as ActiveView, color: "bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100" },
    { label: "Emergency", desc: "Break-glass emergency access", view: "emergency" as ActiveView, color: "bg-red-50 border-red-200 text-red-700 hover:bg-red-100" },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
        <p className="text-slate-500 text-sm mt-1">Welcome back. Here's an overview of the medical records system.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-500">{s.label}</span>
              <div className={`w-8 h-8 ${s.color} rounded-lg flex items-center justify-center`}>
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} /></svg>
              </div>
            </div>
            <p className={`font-bold ${s.isText ? "text-emerald-600 text-base" : "text-2xl text-slate-900"}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map(a => (
              <button key={a.label} onClick={() => onNavigate(a.view)}
                className={`${a.color} border rounded-xl p-4 text-left transition-all`}>
                <p className="font-semibold text-sm">{a.label}</p>
                <p className="text-[11px] mt-1 opacity-70">{a.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Recent Records</h3>
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {records.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">No records yet. Add your first medical record to get started.</div>
            ) : records.slice(0, 5).map(r => (
              <div key={r.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700">Record #{r.id}</p>
                  <p className="text-[11px] text-slate-400">{RecordTypeLabels[r.recordType]} · v{r.version}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[11px] text-slate-400">{new Date(r.timestamp * 1000).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {userRole && (
        <div className="bg-slate-900 rounded-xl p-6 text-center">
          <p className="text-slate-400 text-xs mb-1">Logged in as</p>
          <p className="text-white font-bold text-lg">{userRole}</p>
          <p className="text-slate-500 text-[11px] mt-2">All actions are recorded on the blockchain with immutable audit trails</p>
        </div>
      )}
    </div>
  );
}
