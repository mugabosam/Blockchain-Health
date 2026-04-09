import { useWeb3 } from "../contexts/Web3Context";

export default function LoginScreen() {
  const { connectWallet, isConnecting, error } = useWeb3();

  return (
    <div className="min-h-screen bg-slate-900 flex">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-11 h-11 rounded-xl bg-emerald-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">MediChain</h1>
              <p className="text-sm text-slate-400">Hospital Records System</p>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-white mb-3">Welcome back</h2>
          <p className="text-slate-400 mb-8 leading-relaxed">Connect your wallet to access the decentralized medical records system. Your records are encrypted and stored securely on the blockchain.</p>

          <button onClick={connectWallet} disabled={isConnecting}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-800 text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 text-sm">
            {isConnecting ? (
              <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Connecting...</>
            ) : (
              <><svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>Connect with MetaMask</>
            )}
          </button>

          {error && <p className="mt-4 text-red-400 text-sm bg-red-900/30 px-4 py-2.5 rounded-lg">{error}</p>}

          <div className="mt-10 grid grid-cols-3 gap-4">
            {[["256-bit", "AES Encryption"], ["Polygon", "L2 Blockchain"], ["IPFS", "Decentralized Storage"]].map(([v, l]) => (
              <div key={l} className="text-center">
                <p className="text-white font-bold text-lg">{v}</p>
                <p className="text-slate-500 text-[11px] mt-0.5">{l}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 pt-6 border-t border-slate-800">
            <p className="text-[11px] text-slate-600 leading-relaxed">MediChain v2.1 — Blockchain-secured medical records for hospitals. Built at the University of Rwanda. Patient data is encrypted before storage; only authorized providers can access records.</p>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-emerald-600 to-teal-700 items-center justify-center p-12">
        <div className="max-w-sm text-center">
          <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center mx-auto mb-8">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">Your health data, under your control</h3>
          <p className="text-emerald-100/80 text-sm leading-relaxed">Every record is encrypted, every access is logged, and only you decide who sees your medical history. Powered by Ethereum blockchain technology.</p>
          <div className="mt-8 flex justify-center gap-6">
            {["Tamper-proof records", "Instant access control", "Full audit trail"].map(f => (
              <div key={f} className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                <span className="text-[11px] text-emerald-100 font-medium">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
