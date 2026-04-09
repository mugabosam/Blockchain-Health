import { useState } from "react";
import { useAdmin } from "../hooks/useAdmin";
import toast from "react-hot-toast";

export default function AdminPage() {
  const { registerStaff, declareDeceased, pauseSystem, unpauseSystem, loading } = useAdmin();
  const [staffForm, setStaffForm] = useState({ address: "", role: "doctor" as "doctor" | "nurse" | "pharmacist" | "labTech" });
  const [deceasedForm, setDeceasedForm] = useState({ patient: "", executor: "" });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await registerStaff(staffForm.address, staffForm.role); toast.success(`${staffForm.role} registered`); setStaffForm({ address: "", role: "doctor" }); }
    catch (e: any) { toast.error(e.reason || "Registration failed"); }
  };

  const handleDeceased = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.confirm("This action is irreversible. Confirm patient death declaration?")) return;
    try { await declareDeceased(deceasedForm.patient, deceasedForm.executor); toast.success("Patient declared deceased"); setDeceasedForm({ patient: "", executor: "" }); }
    catch (e: any) { toast.error(e.reason || "Failed"); }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6"><h2 className="text-2xl font-bold text-slate-900">Administration</h2><p className="text-slate-500 text-sm mt-1">System management — Admin access only</p></div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-1">Register Staff</h3>
          <p className="text-xs text-slate-500 mb-4">Add healthcare providers to the system with role-based access.</p>
          <form onSubmit={handleRegister} className="space-y-4">
            <div><label className="block text-xs font-medium text-slate-600 mb-1.5">Wallet Address</label><input value={staffForm.address} onChange={e => setStaffForm({...staffForm, address: e.target.value})} placeholder="0x..." className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-mono focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
            <div><label className="block text-xs font-medium text-slate-600 mb-1.5">Role</label>
              <select value={staffForm.role} onChange={e => setStaffForm({...staffForm, role: e.target.value as any})} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
                <option value="doctor">Doctor</option><option value="nurse">Nurse</option><option value="pharmacist">Pharmacist</option><option value="labTech">Lab Technician</option>
              </select>
            </div>
            <button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-medium py-2.5 px-6 rounded-lg text-sm w-full">{loading ? "Processing..." : "Register on Blockchain"}</button>
          </form>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-1">Death Protocol</h3>
          <p className="text-xs text-slate-500 mb-4">Declare a patient deceased and assign a legal record executor.</p>
          <form onSubmit={handleDeceased} className="space-y-4">
            <div><label className="block text-xs font-medium text-slate-600 mb-1.5">Patient Address</label><input value={deceasedForm.patient} onChange={e => setDeceasedForm({...deceasedForm, patient: e.target.value})} placeholder="0x..." className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-mono focus:ring-2 focus:ring-red-500 outline-none" /></div>
            <div><label className="block text-xs font-medium text-slate-600 mb-1.5">Executor Address</label><input value={deceasedForm.executor} onChange={e => setDeceasedForm({...deceasedForm, executor: e.target.value})} placeholder="0x..." className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-mono focus:ring-2 focus:ring-red-500 outline-none" /></div>
            <button type="submit" disabled={loading} className="bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-medium py-2.5 px-6 rounded-lg text-sm w-full">{loading ? "Processing..." : "Declare Deceased"}</button>
          </form>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-1">System Controls</h3>
          <p className="text-xs text-slate-500 mb-4">Emergency system pause/unpause for security incidents.</p>
          <div className="flex gap-3">
            <button onClick={async () => { try { await pauseSystem(); toast.success("System paused"); } catch (e: any) { toast.error(e.reason || "Failed"); }}} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-medium py-2.5 rounded-lg text-sm">Pause System</button>
            <button onClick={async () => { try { await unpauseSystem(); toast.success("System resumed"); } catch (e: any) { toast.error(e.reason || "Failed"); }}} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg text-sm">Resume System</button>
          </div>
        </div>
      </div>
    </div>
  );
}
