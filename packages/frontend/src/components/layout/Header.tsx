import { useWeb3 } from "../../contexts/Web3Context";

export default function Header({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { account, userRole, disconnectWallet, fmt } = useWeb3();

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0">
      <button onClick={onToggleSidebar} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
        <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
      </button>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {userRole && (
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
              userRole === "Admin" ? "bg-violet-100 text-violet-700" :
              userRole === "Doctor" ? "bg-blue-100 text-blue-700" :
              userRole === "Nurse" ? "bg-teal-100 text-teal-700" :
              userRole === "Pharmacist" ? "bg-amber-100 text-amber-700" :
              userRole === "Lab Technician" ? "bg-purple-100 text-purple-700" :
              "bg-slate-100 text-slate-600"
            }`}>{userRole}</span>
          )}
          <span className="text-xs text-slate-500 font-mono bg-slate-50 px-2.5 py-1.5 rounded-md">{account && fmt(account)}</span>
        </div>
        <button onClick={disconnectWallet} className="text-xs text-slate-400 hover:text-red-500 transition-colors font-medium">Sign out</button>
      </div>
    </header>
  );
}
