import { useState, useCallback } from "react";
import { useWeb3 } from "../contexts/Web3Context";

export function useAdmin() {
  const { contract } = useWeb3();
  const [loading, setLoading] = useState(false);

  const registerStaff = useCallback(async (address: string, role: "doctor" | "nurse" | "pharmacist" | "labTech") => {
    if (!contract) throw new Error("Not connected");
    setLoading(true);
    try {
      const fns: Record<string, string> = { doctor: "registerDoctor", nurse: "registerNurse", pharmacist: "registerPharmacist", labTech: "registerLabTech" };
      const tx = await (contract as any)[fns[role]](address);
      await tx.wait();
    } finally { setLoading(false); }
  }, [contract]);

  const declareDeceased = useCallback(async (patient: string, executor: string) => {
    if (!contract) throw new Error("Not connected");
    setLoading(true);
    try { const tx = await contract.declareDeceased(patient, executor); await tx.wait(); }
    finally { setLoading(false); }
  }, [contract]);

  const pauseSystem = useCallback(async () => {
    if (!contract) throw new Error("Not connected");
    const tx = await contract.pause(); await tx.wait();
  }, [contract]);

  const unpauseSystem = useCallback(async () => {
    if (!contract) throw new Error("Not connected");
    const tx = await contract.unpause(); await tx.wait();
  }, [contract]);

  const getRecordCount = useCallback(async (): Promise<number> => {
    if (!contract) return 0;
    return Number(await contract.getRecordCount());
  }, [contract]);

  const getAuditSize = useCallback(async (): Promise<number> => {
    if (!contract) return 0;
    return Number(await contract.getAuditLogSize());
  }, [contract]);

  return { registerStaff, declareDeceased, pauseSystem, unpauseSystem, getRecordCount, getAuditSize, loading };
}
