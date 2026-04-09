import { useState } from "react";
import { useWeb3 } from "../contexts/Web3Context";
import toast from "react-hot-toast";

export default function EmergencyPage() {
  const { contract, account, userRole } = useWeb3();
  const [patientAddress, setPatientAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [activated, setActivated] = useState(false);

  const handleEmergency = async () => {
    if (!contract || !patientAddress.trim()) { toast.error("Enter patient address"); return; }
    if (!window.confirm("EMERGENCY ACCESS: This action will be permanently logged on the blockchain with your identity. A mandatory incident report is required within 48 hours. Continue?")) return;
    setLoading(true);
    try {
      const tx = await contract.emergencyAccess(patientAddress);
      await tx.wait();
      toast.success("Emergency access granted for 24 hours");
      setActivated(true);
    } catch (e: any) { toast.error(e.reason || "Emergency access failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Emergency Access</h2>
        <p className="text-slate-500 text-sm mt-1">Break-glass protocol for life-threatening situations</p>
      </div>

      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-red-800 mb-1">Emergency Break-Glass Protocol</h3>
            <p className="text-sm text-red-700 leading-relaxed">
              This grants immediate 24-hour access to ALL records of the specified patient. 
              Use ONLY when a patient is incapacitated and immediate access to medical history is required for life-saving treatment.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h3 className="text-base font-semibold text-slate-800 mb-4">Activate Emergency Access</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Patient Wallet Address *</label>
            <input
              value={patientAddress}
              onChange={e => setPatientAddress(e.target.value)}
              placeholder="0x..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-mono focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="text-xs font-bold text-amber-800 mb-2">This action will:</h4>
            <ul className="space-y-1.5 text-xs text-amber-700">
              <li className="flex items-start gap-2">
                <svg className="w-3.5 h-3.5 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                Grant you full access to ALL patient records for 24 hours
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-3.5 h-3.5 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                Log your identity, the patient, and timestamp permanently on the blockchain
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-3.5 h-3.5 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                Send an immediate notification to the patient
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-3.5 h-3.5 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                Require a mandatory incident report within 48 hours
              </li>
            </ul>
          </div>

          <button
            onClick={handleEmergency}
            disabled={loading || !patientAddress.trim() || (userRole !== "Doctor" && userRole !== "Nurse" && userRole !== "Admin")}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-bold py-3.5 px-6 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
          >
            {loading ? (
              <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Processing...</>
            ) : (
              <><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>Activate Emergency Access</>
            )}
          </button>

          {userRole !== "Doctor" && userRole !== "Nurse" && userRole !== "Admin" && (
            <p className="text-xs text-red-500 text-center">Emergency access is restricted to clinical staff (Doctors and Nurses only).</p>
          )}
        </div>
      </div>

      {activated && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <h3 className="text-base font-bold text-emerald-800">Emergency Access Active</h3>
          </div>
          <p className="text-sm text-emerald-700 mb-2">You now have 24-hour access to all records for patient {patientAddress.slice(0, 10)}...</p>
          <p className="text-xs text-emerald-600">Access will automatically expire in 24 hours. Navigate to Medical Records to view patient data.</p>
        </div>
      )}

      <div className="mt-6 bg-slate-50 rounded-xl p-5 border border-slate-200">
        <h4 className="text-xs font-semibold text-slate-600 mb-2">Audit & Compliance</h4>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          All emergency access events are permanently recorded on the blockchain and cannot be modified or deleted.
          Hospital compliance officers can review all emergency access events through the audit dashboard.
          Misuse of emergency access is a violation of hospital policy and may result in role revocation.
        </p>
      </div>
    </div>
  );
}
