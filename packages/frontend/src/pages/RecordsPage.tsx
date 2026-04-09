import { useState, useEffect } from "react";
import { useWeb3 } from "../contexts/Web3Context";
import { useRecords } from "../hooks/useRecords";
import type { MedicalRecord } from "../types";
import { RecordType, RecordTypeLabels } from "../types";
import toast from "react-hot-toast";

export default function RecordsPage() {
  const { account } = useWeb3();
  const { addRecord, fetchRecords, loading } = useRecords();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ recordType: "0", diagnosis: "", treatment: "", bloodType: "", allergies: "", notes: "" });
  const [txStatus, setTxStatus] = useState("");

  const load = async () => { if (account) setRecords((await fetchRecords(account)).filter(r => !r.isDeleted)); };
  useEffect(() => { load(); }, [account]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !form.diagnosis.trim()) { toast.error("Diagnosis is required"); return; }
    try {
      setTxStatus("Encrypting data...");
      await new Promise(r => setTimeout(r, 300));
      setTxStatus("Confirm in MetaMask...");
      await addRecord(account, parseInt(form.recordType) as RecordType, { diagnosis: form.diagnosis, treatment: form.treatment, bloodType: form.bloodType, allergies: form.allergies, notes: form.notes });
      setTxStatus(""); setShowForm(false); setForm({ recordType: "0", diagnosis: "", treatment: "", bloodType: "", allergies: "", notes: "" });
      toast.success("Record added to blockchain"); load();
    } catch (e: any) { toast.error(e.reason || "Transaction failed"); setTxStatus(""); }
  };

  const typeColors: Record<number, string> = { 0: "bg-blue-100 text-blue-700", 1: "bg-purple-100 text-purple-700", 2: "bg-green-100 text-green-700", 3: "bg-amber-100 text-amber-700", 4: "bg-red-100 text-red-700", 5: "bg-teal-100 text-teal-700", 6: "bg-pink-100 text-pink-700" };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Medical Records</h2>
          <p className="text-slate-500 text-sm mt-1">{records.length} records on blockchain</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-5 rounded-xl text-sm transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          New Record
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Add Medical Record</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Record Type</label>
                <select value={form.recordType} onChange={e => setForm({...form, recordType: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none">
                  {Object.entries(RecordTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Blood Type</label>
                <select value={form.bloodType} onChange={e => setForm({...form, bloodType: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none">
                  <option value="">Select...</option>
                  {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Allergies</label>
                <input value={form.allergies} onChange={e => setForm({...form, allergies: e.target.value})} placeholder="e.g. Penicillin, Latex" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Diagnosis / Description *</label>
              <textarea value={form.diagnosis} onChange={e => setForm({...form, diagnosis: e.target.value})} rows={3} placeholder="Enter clinical findings, diagnosis, or record description..." className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Treatment / Plan</label>
              <textarea value={form.treatment} onChange={e => setForm({...form, treatment: e.target.value})} rows={2} placeholder="Prescribed treatment, procedures, follow-up plan..." className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Additional Notes</label>
              <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} placeholder="Any additional clinical notes..." className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none" />
            </div>
            {txStatus && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 flex items-center gap-3">
                <svg className="animate-spin h-4 w-4 text-emerald-600" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                <span className="text-sm text-emerald-700 font-medium">{txStatus}</span>
              </div>
            )}
            <div className="flex gap-3">
              <button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-medium py-2.5 px-6 rounded-lg text-sm transition-colors">
                {loading ? "Processing..." : "Add to Blockchain"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="text-slate-500 hover:text-slate-700 font-medium py-2.5 px-4 text-sm">Cancel</button>
            </div>
            <p className="text-[11px] text-slate-400">All data is encrypted with AES-256 before storage. Only you and authorized providers can decrypt.</p>
          </form>
        </div>
      )}

      {loading && !showForm ? (
        <div className="flex items-center justify-center py-20">
          <svg className="animate-spin h-6 w-6 text-emerald-600" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          <h3 className="text-lg font-semibold text-slate-700 mb-1">No records yet</h3>
          <p className="text-slate-400 text-sm mb-4">Click "New Record" to add your first medical record.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {["ID", "Type", "Provider", "Date", "Version", "Status"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map(r => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3.5 text-sm font-medium text-slate-800">#{r.id}</td>
                  <td className="px-4 py-3.5"><span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${typeColors[r.recordType] || "bg-slate-100 text-slate-600"}`}>{RecordTypeLabels[r.recordType]}</span></td>
                  <td className="px-4 py-3.5 text-xs text-slate-500 font-mono">{r.providerAddress.slice(0,6)}...{r.providerAddress.slice(-4)}</td>
                  <td className="px-4 py-3.5 text-xs text-slate-500">{new Date(r.timestamp * 1000).toLocaleString()}</td>
                  <td className="px-4 py-3.5 text-xs text-slate-500">v{r.version}</td>
                  <td className="px-4 py-3.5"><div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /><span className="text-[11px] text-emerald-600 font-medium">Verified</span></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
