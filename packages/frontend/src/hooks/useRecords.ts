import { useState, useCallback } from "react";
import { useWeb3 } from "../contexts/Web3Context";
import { encryptData, integrityHash } from "../services/encryption";
import type { MedicalRecord, DecryptedRecordData } from "../types";
import { RecordType } from "../types";

export function useRecords() {
  const { contract, account, provider } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addRecord = useCallback(async (patient: string, type: RecordType, data: DecryptedRecordData) => {
    if (!contract || !account || !provider) throw new Error("Not connected");
    setLoading(true); setError(null);
    try {
      const id = `new-${Date.now()}`;
      const { encrypted, salt } = await encryptData(data, provider, patient, id);
      const cid = `data:${salt}:${encrypted}`;
      const hash = integrityHash(encrypted);
      const tx = await contract.addRecord(patient, type, cid, hash);
      return await tx.wait();
    } catch (e: any) { setError(e.reason || e.message); throw e; }
    finally { setLoading(false); }
  }, [contract, account, provider]);

  const fetchRecords = useCallback(async (patient: string): Promise<MedicalRecord[]> => {
    if (!contract) return [];
    setLoading(true); setError(null);
    try {
      const [ids] = await contract.getPatientRecordIds(patient, 0, 100);
      const records: MedicalRecord[] = [];
      for (const id of ids) {
        try {
          const r = await contract.getRecord.staticCall(id);
          if (!r.isDeleted) records.push({
            id: Number(r.id), recordType: Number(r.recordType) as RecordType,
            patientAddress: r.patientAddress, providerAddress: r.providerAddress,
            ipfsCID: r.ipfsCID, integrityHash: r.integrityHash,
            timestamp: Number(r.timestamp), version: Number(r.version), isDeleted: r.isDeleted,
          });
        } catch { continue; }
      }
      return records;
    } catch (e: any) { setError(e.message); return []; }
    finally { setLoading(false); }
  }, [contract]);

  const deleteRecord = useCallback(async (id: number) => {
    if (!contract) throw new Error("Not connected");
    setLoading(true);
    try { const tx = await contract.softDeleteRecord(id); await tx.wait(); }
    finally { setLoading(false); }
  }, [contract]);

  const grantAccess = useCallback(async (grantee: string, recordId: number, role: number, duration: number) => {
    if (!contract) throw new Error("Not connected");
    setLoading(true);
    try { const tx = await contract.grantAccess(grantee, recordId, role, duration); await tx.wait(); }
    finally { setLoading(false); }
  }, [contract]);

  const revokeAccess = useCallback(async (grantee: string, recordId: number) => {
    if (!contract) throw new Error("Not connected");
    setLoading(true);
    try { const tx = await contract.revokeAccess(grantee, recordId); await tx.wait(); }
    finally { setLoading(false); }
  }, [contract]);

  return { addRecord, fetchRecords, deleteRecord, grantAccess, revokeAccess, loading, error };
}
