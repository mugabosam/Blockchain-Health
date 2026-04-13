import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Lock,
  Fingerprint,
  ArrowRight,
  Hexagon,
  Activity,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import type { UserRole } from "../types";
import toast from "react-hot-toast";

const NODES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: 15 + Math.random() * 70,
  y: 10 + Math.random() * 80,
  size: 3 + Math.random() * 5,
  delay: Math.random() * 4,
}));

export default function LoginPage() {
  const navigate = useNavigate();
  const { connect, isConnecting } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>("doctor");

  const handleConnect = async () => {
    try {
      await connect(selectedRole);
      navigate("/dashboard");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Wallet connection failed.";
      toast.error(message);
    }
  };

  const roles: { value: UserRole; label: string; desc: string }[] = [
    { value: "admin", label: "Administrator", desc: "Full system control" },
    {
      value: "doctor",
      label: "Physician",
      desc: "Patient records & prescriptions",
    },
    { value: "nurse", label: "Nurse", desc: "Vital signs & care notes" },
    {
      value: "pharmacist",
      label: "Pharmacist",
      desc: "Prescription dispensing",
    },
    { value: "patient", label: "Patient", desc: "View records & share access" },
    { value: "auditor", label: "Auditor", desc: "Compliance & audit trail" },
  ];

  return (
    <div className="min-h-screen flex bg-surface">
      {/* Left panel: Visual */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-surface-container-lowest items-center justify-center">
        {/* Animated node network */}
        <svg
          className="absolute inset-0 w-full h-full opacity-20"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {NODES.map((node, i) =>
            NODES.slice(i + 1, i + 4).map((target, j) => (
              <motion.line
                key={`${i}-${j}`}
                x1={`${node.x}%`}
                y1={`${node.y}%`}
                x2={`${target.x}%`}
                y2={`${target.y}%`}
                stroke="#4edea3"
                strokeWidth="0.15"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.4, 0] }}
                transition={{
                  duration: 4,
                  delay: node.delay + j * 0.5,
                  repeat: Infinity,
                }}
              />
            )),
          )}
          {NODES.map((node) => (
            <motion.circle
              key={node.id}
              cx={`${node.x}%`}
              cy={`${node.y}%`}
              r={node.size * 0.15}
              fill="#4edea3"
              initial={{ opacity: 0.2 }}
              animate={{ opacity: [0.2, 0.7, 0.2] }}
              transition={{
                duration: 3,
                delay: node.delay,
                repeat: Infinity,
              }}
            />
          ))}
        </svg>

        {/* Radial glow */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(78,222,163,0.06), transparent)",
          }}
        />

        {/* Center content */}
        <div className="relative z-10 max-w-md px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center glow-primary">
                <ShieldCheck size={24} className="text-on-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-on-surface font-headline tracking-tight">
                  MediChain
                </h1>
                <p className="label-sm text-primary">
                  Decentralized Clinical Ledger
                </p>
              </div>
            </div>

            <h2 className="text-4xl font-extrabold text-on-surface font-headline leading-tight mb-4">
              Immutable.
              <br />
              <span className="text-gradient-primary">Encrypted.</span>
              <br />
              Patient-Sovereign.
            </h2>

            <p className="text-on-surface-variant/60 text-sm leading-relaxed mb-10">
              Medical records secured by blockchain consensus, encrypted with
              MetaMask-derived keys, and controlled exclusively by the patient.
              Zero-knowledge proofs verify provider credentials without exposing
              identity.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-3">
              {[
                { icon: <Hexagon size={14} />, text: "8-Role Access Control" },
                { icon: <Lock size={14} />, text: "HKDF Encryption" },
                { icon: <Activity size={14} />, text: "On-Chain Audit Trail" },
              ].map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.15 }}
                  className="flex items-center gap-2 bg-surface-container/60 backdrop-blur-sm rounded-full px-4 py-2 text-xs text-on-surface-variant"
                >
                  <span className="text-primary">{f.icon}</span>
                  {f.text}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right panel: Connect */}
      <div className="flex-1 flex items-center justify-center px-8 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-10">
            <div className="lg:hidden flex items-center justify-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center">
                <ShieldCheck size={20} className="text-on-primary" />
              </div>
              <h1 className="text-xl font-extrabold text-primary font-headline">
                MediChain
              </h1>
            </div>
            <h2 className="text-2xl font-bold text-on-surface font-headline mb-2">
              Authorized Clinical Gateway
            </h2>
            <p className="text-sm text-on-surface-variant/50">
              Connect your hardware wallet to access the medical ledger
            </p>
          </div>

          {/* Role selector */}
          <div className="mb-8">
            <p className="label-sm text-primary mb-3">Select Your Role</p>
            <div className="grid grid-cols-2 gap-2">
              {roles.map((role) => (
                <button
                  key={role.value}
                  onClick={() => setSelectedRole(role.value)}
                  className={`p-3 rounded-xl text-left transition-all duration-200 ${
                    selectedRole === role.value
                      ? "bg-surface-container-low ring-2 ring-primary/30"
                      : "bg-surface-container-high/30 hover:bg-surface-container-high/50"
                  }`}
                >
                  <p
                    className={`text-sm font-semibold ${
                      selectedRole === role.value
                        ? "text-primary"
                        : "text-on-surface"
                    }`}
                  >
                    {role.label}
                  </p>
                  <p className="text-[0.65rem] text-on-surface-variant/40 mt-0.5">
                    {role.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Connect button */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleConnect}
            disabled={isConnecting}
            className="btn-primary w-full py-4 text-base relative overflow-hidden group"
          >
            {isConnecting ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Activity size={20} />
              </motion.div>
            ) : (
              <>
                <Fingerprint size={20} />
                Connect Wallet
                <ArrowRight
                  size={16}
                  className="ml-1 group-hover:translate-x-1 transition-transform"
                />
              </>
            )}
            {/* Inner glow on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          </motion.button>

          {/* Security note */}
          <div className="mt-6 flex items-start gap-3 p-4 bg-surface-container-high/20 rounded-xl">
            <Lock size={16} className="text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-on-surface-variant/40 leading-relaxed">
              This is a demo interface. In production, authentication requires a
              biometric-secured hardware wallet with MetaMask signature
              verification.
            </p>
          </div>

          {/* Version */}
          <p className="text-center text-[0.625rem] text-on-surface-variant/25 mt-8 font-mono">
            MediChain v1.0.0 · Polygon Amoy Testnet · Contract: 0x...deployed
          </p>
        </motion.div>
      </div>
    </div>
  );
}
