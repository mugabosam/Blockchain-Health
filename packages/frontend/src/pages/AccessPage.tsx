import { useState } from "react";
import { useWeb3 } from "../contexts/Web3Context";
import { useRecords } from "../hooks/useRecords";
import { RoleLabels, Role } from "../types";
import toast from "react-hot-toast";

export default function AccessPage() {
  const { account } = useWeb3();
  const { grantAccess, revokeAccess, loading } = useRecords();
  const [tab, setTab] = useState<"grant" | "revoke">("grant");
  const [grantForm, setGrantForm] = useState({ address: "", recordId: "0", role: "2", days: "30" });
  const [revokeForm, setRevokeForm] = useState({ address: "", recordId: "0" });

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const duration = parseInt(grantForm.days) * 86400;
      await grantAccess(grantForm.address, parseInt(grantForm.recordId), parseInt(grantForm.role), duration);
      toast.success("Access granted on blockchain"); setGrantForm({ address: "", recordId: "0", role: "2", days: "30" });
    } catch (e: any) { toast.error(e.reason || "Failed to grant access"); }
  };

  const handleRevoke = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await revokeAccess(revokeForm.address, parseInt(revokeForm.recordId)); toast.success("Access revoked"); setRevokeForm({ address: "", recordId: "0" }); }
    catch (e: any) { toast.error(e.reason || "Failed to revoke access"); }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6"><h2 className="text-2xl font-bold text-slate-900">Access Control</h2><p className="text-slate-500 text-sm mt-1">Grant or revoke access to your medical records</p></div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg mb-6 w-fit">
        {(["grant", "revoke"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            {t === "grant" ? "Grant Access" : "Revoke Access"}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        {tab === "grant" ? (
          <form onSubmit={handleGrant} className="space-y-4">
            <h3 className="text-base font-semibold text-slate-800 mb-2">Grant Record Access</h3>
            <p className="text-xs text-slate-500 mb-4">Share specific records or all records with a healthcare provider for a limited time.</p>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Provider Wallet Address *</label>
              <input value={grantForm.address} onChange={e => setGrantForm({...grantForm, address: e.target.value})} placeholder="0x..." className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-mono focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Record ID</label>
                <input type="number" min="0" value={grantForm.recordId} onChange={e => setGrantForm({...grantForm, recordId: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                <p className="text-[10px] text-slate-400 mt-1">0 = all records</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Role</label>
                <select value={grantForm.role} onChange={e => setGrantForm({...grantForm, role: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
                  {[2,3,4,5,6,7].map(r => <option key={r} value={r}>{RoleLabels[r as Role]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Duration (days)</label>
                <input type="number" min="1" max="365" value={grantForm.days} onChange={e => setGrantForm({...grantForm, days: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-medium py-2.5 px-6 rounded-lg text-sm">{loading ? "Processing..." : "Grant Access"}</button>
            <p className="text-[11px] text-slate-400">Access auto-expires after the specified duration. You can revoke at any time.</p>
          </form>
        ) : (
          <form onSubmit={handleRevoke} className="space-y-4">
            <h3 className="text-base font-semibold text-slate-800 mb-2">Revoke Record Access</h3>
            <p className="text-xs text-slate-500 mb-4">Immediately remove a provider's access to your records.</p>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Provider Wallet Address *</label>
              <input value={revokeForm.address} onChange={e => setRevokeForm({...revokeForm, address: e.target.value})} placeholder="0x..." className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-mono focus:ring-2 focus:ring-red-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Record ID</label>
              <input type="number" min="0" value={revokeForm.recordId} onChange={e => setRevokeForm({...revokeForm, recordId: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-500 outline-none" />
              <p className="text-[10px] text-slate-400 mt-1">0 = revoke all access for this provider</p>
            </div>
            <button type="submit" disabled={loading} className="bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-medium py-2.5 px-6 rounded-lg text-sm">{loading ? "Processing..." : "Revoke Access"}</button>
          </form>
        )}
      </div>
    </div>
  );
}
