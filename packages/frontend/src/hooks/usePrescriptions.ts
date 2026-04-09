import { useState, useCallback } from "react";
import { useWeb3 } from "../contexts/Web3Context";
import { encryptData, integrityHash } from "../services/encryption";
import type { PrescriptionData } from "../types";

export function usePrescriptions() {
  const { contract, account, provider } = useWeb3();
  const [loading, setLoading] = useState(false);

  const writePrescription = useCallback(async (patient: string, data: object, refills: number, validDays: number) => {
    if (!contract || !provider || !account) throw new Error("Not connected");
    setLoading(true);
    try {
      const { encrypted, salt } = await encryptData(data, provider, patient, `rx-${Date.now()}`);
      const cid = `rxdata:${salt}:${encrypted}`;
      const tx = await contract.writePrescription(patient, cid, refills, validDays);
      return await tx.wait();
    } finally { setLoading(false); }
  }, [contract, provider, account]);

  const dispensePrescription = useCallback(async (rxId: number) => {
    if (!contract) throw new Error("Not connected");
    setLoading(true);
    try { const tx = await contract.dispensePrescription(rxId); await tx.wait(); }
    finally { setLoading(false); }
  }, [contract]);

  const fetchPrescriptions = useCallback(async (patient: string): Promise<PrescriptionData[]> => {
    if (!contract) return [];
    setLoading(true);
    try {
      const [ids] = await contract.getPatientPrescriptionIds(patient, 0, 100);
      const rxs: PrescriptionData[] = [];
      for (const id of ids) {
        try {
          const r = await contract.getPrescription(id);
          rxs.push({ id: Number(r.id), recordId: Number(r.recordId), prescriber: r.prescriber, dispensedBy: r.dispensedBy, status: Number(r.status), refillsRemaining: Number(r.refillsRemaining), expiresAt: Number(r.expiresAt), ipfsCID: r.ipfsCID });
        } catch { continue; }
      }
      return rxs;
    } finally { setLoading(false); }
  }, [contract]);

  return { writePrescription, dispensePrescription, fetchPrescriptions, loading };
}
