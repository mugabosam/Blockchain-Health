import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  FileText,
  Pill,
  User,
  Clock,
  ChevronRight,
  ShieldCheck,
  Send,
} from "lucide-react";
import { isAddress } from "ethers";
import toast from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";
import {
  type ChainMedicalRecord,
  type RecordTypeLabel,
  fetchPatientRecords,
  getMediChainContract,
  hasConfiguredContract,
  toRecordTypeValue,
} from "../utils/medichainContract";
import {
  hasIpfsUploadConfig,
  uploadEncryptedRecord,
} from "../utils/ipfsUpload";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4 },
});

const RECORD_TYPES: RecordTypeLabel[] = [
  "Clinical Encounter",
  "Lab Result",
  "Imaging",
  "Vital Signs",
  "Immunization",
  "Surgical History",
];

const MOCK_PATIENTS = [
  {
    id: "P-3392",
    name: "Maria Santos",
    age: 31,
    condition: "Prenatal Care",
    lastVisit: "1 week ago",
    address: "0x1234567890123456789012345678901234567890",
  },
  {
    id: "P-1102",
    name: "Robert Kim",
    age: 67,
    condition: "Post-Op Recovery",
    lastVisit: "Today",
    address: "0x2345678901234567890123456789012345678901",
  },
  {
    id: "P-7703",
    name: "Elena Vasquez",
    age: 42,
    condition: "Diabetes T2",
    lastVisit: "3 days ago",
    address: "0x3456789012345678901234567890123456789012",
  },
];

type Patient = {
  id: string;
  name: string;
  age: number;
  condition: string;
  lastVisit: string;
  address: string;
};

function formatDate(unixTimestamp: number): string {
  return new Date(unixTimestamp * 1000).toLocaleString();
}

function shortHex(value: string): string {
  if (value.length < 12) {
    return value;
  }

  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

export default function DoctorPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState<
    "history" | "record" | "prescribe"
  >("history");

  const [recordType, setRecordType] =
    useState<RecordTypeLabel>("Clinical Encounter");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [icdCode, setIcdCode] = useState("");
  const [priority, setPriority] = useState("Routine");

  const [historyRecords, setHistoryRecords] = useState<ChainMedicalRecord[]>(
    [],
  );
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSubmittingRecord, setIsSubmittingRecord] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const patients = useMemo<Patient[]>(() => {
    if (!user?.address || !isAddress(user.address)) {
      return MOCK_PATIENTS;
    }

    return [
      {
        id: "SELF",
        name: `${user.name} (You)`,
        age: 0,
        condition: "Self-managed profile",
        lastVisit: "Current session",
        address: user.address,
      },
      ...MOCK_PATIENTS,
    ];
  }, [user?.address, user?.name]);

  useEffect(() => {
    if (!selectedPatient && patients.length > 0) {
      setSelectedPatient(patients[0]);
    }
  }, [patients, selectedPatient]);

  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(search.toLowerCase()) ||
      patient.id.toLowerCase().includes(search.toLowerCase()),
  );

  const loadPatientHistory = useCallback(async (patientAddress: string) => {
    if (!isAddress(patientAddress)) {
      setHistoryError("Invalid patient wallet address.");
      setHistoryRecords([]);
      return;
    }

    if (!hasConfiguredContract()) {
      setHistoryError("Contract address is not configured in frontend .env.");
      setHistoryRecords([]);
      return;
    }

    setIsLoadingHistory(true);
    setHistoryError(null);

    try {
      const contract = await getMediChainContract(false);
      const records = await fetchPatientRecords(contract, patientAddress);
      setHistoryRecords(records);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to load patient history.";
      setHistoryError(message);
      setHistoryRecords([]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedPatient) {
      return;
    }

    void loadPatientHistory(selectedPatient.address);
  }, [selectedPatient, loadPatientHistory]);

  const handleSubmitRecord = async () => {
    if (!selectedPatient) {
      toast.error("Select a patient first.");
      return;
    }

    if (!clinicalNotes.trim()) {
      toast.error("Clinical notes are required.");
      return;
    }

    if (!hasConfiguredContract()) {
      toast.error(
        "Set VITE_MEDICHAIN_CONTRACT_ADDRESS in .env before sending transactions.",
      );
      return;
    }

    if (!hasIpfsUploadConfig()) {
      toast.error(
        "Configure VITE_IPFS_UPLOAD_URL or VITE_PINATA_JWT in .env before saving records.",
      );
      return;
    }

    setIsSubmittingRecord(true);

    try {
      const payload = JSON.stringify({
        clinicalNotes,
        icdCode,
        priority,
        submittedAt: new Date().toISOString(),
      });

      toast.loading("Encrypting and uploading record to IPFS...", {
        id: "ipfs-upload",
      });

      const { cid, encryptedHash } = await uploadEncryptedRecord(
        payload,
        selectedPatient.address,
      );

      toast.loading("Submitting blockchain transaction...", {
        id: "ipfs-upload",
      });

      const contract = await getMediChainContract(true);
      const tx = await contract.addRecord(
        selectedPatient.address,
        toRecordTypeValue(recordType),
        cid,
        encryptedHash,
      );

      await tx.wait();
      toast.dismiss("ipfs-upload");
      toast.success("Record saved on-chain successfully.");

      setClinicalNotes("");
      setIcdCode("");
      setPriority("Routine");
      setActiveTab("history");
      await loadPatientHistory(selectedPatient.address);
    } catch (error) {
      toast.dismiss("ipfs-upload");
      const message =
        error instanceof Error
          ? error.message
          : "Could not save record on-chain.";
      toast.error(message);
    } finally {
      setIsSubmittingRecord(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div {...fadeUp(0)}>
        <h1 className="text-2xl font-extrabold text-on-surface font-headline">
          Doctor Portal
        </h1>
        <p className="text-sm text-on-surface-variant/50 mt-1">
          Search patients, review chain history, and create records that persist
          on the smart contract
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <motion.div {...fadeUp(0.1)} className="lg:col-span-4 card p-6 h-fit">
          <h2 className="text-sm font-bold text-on-surface font-headline mb-4 flex items-center gap-2">
            <User size={16} className="text-primary" />
            Patient Search
          </h2>

          <div className="relative mb-4">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/30"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name or ID..."
              className="input-vault pl-11"
            />
          </div>

          <div className="space-y-2">
            {filteredPatients.map((patient, index) => (
              <motion.button
                key={patient.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + index * 0.05 }}
                onClick={() => {
                  setSelectedPatient(patient);
                  setActiveTab("history");
                }}
                className={`w-full text-left p-4 rounded-xl transition-all duration-200 group ${
                  selectedPatient?.id === patient.id
                    ? "bg-surface-container-high ring-1 ring-primary/20"
                    : "bg-surface-container-high/20 hover:bg-surface-container-high/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-on-surface">
                      {patient.name}
                    </p>
                    <p className="text-[0.65rem] text-on-surface-variant/40 mt-0.5">
                      {patient.id} ·{" "}
                      {patient.age > 0 ? `${patient.age}y` : "n/a"} ·{" "}
                      {patient.condition}
                    </p>
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-on-surface-variant/20 group-hover:text-primary transition-colors"
                  />
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <Clock size={10} className="text-on-surface-variant/25" />
                  <span className="text-[0.6rem] text-on-surface-variant/30">
                    {patient.lastVisit}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        <motion.div {...fadeUp(0.2)} className="lg:col-span-8">
          {selectedPatient ? (
            <div className="space-y-6">
              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-on-surface font-headline">
                      {selectedPatient.name}
                    </h2>
                    <p className="text-xs text-on-surface-variant/40 font-mono mt-1">
                      {selectedPatient.address}
                    </p>
                    <div className="flex gap-3 mt-2">
                      <span className="label-sm bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                        {selectedPatient.condition}
                      </span>
                      <span className="label-sm bg-surface-variant text-on-surface-variant px-2.5 py-1 rounded-full">
                        {selectedPatient.age > 0
                          ? `Age ${selectedPatient.age}`
                          : "Connected wallet"}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveTab("record")}
                      className="btn-primary py-2.5 px-5 text-xs"
                    >
                      <Plus size={14} /> New Record
                    </button>
                    <button
                      onClick={() => setActiveTab("prescribe")}
                      className="btn-secondary py-2.5 px-5 text-xs"
                    >
                      <Pill size={14} /> Prescribe
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-1 bg-surface-container-high/30 p-1 rounded-xl w-fit">
                {(["history", "record", "prescribe"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                      activeTab === tab
                        ? "bg-surface-container-low text-primary"
                        : "text-on-surface-variant/50 hover:text-on-surface"
                    }`}
                  >
                    {tab === "record" ? "Add Record" : tab}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {activeTab === "history" && (
                  <motion.div
                    key="history"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="card overflow-hidden"
                  >
                    <div className="p-6 pb-3">
                      <h3 className="text-sm font-bold text-on-surface font-headline flex items-center gap-2">
                        <FileText size={16} className="text-primary" />
                        Medical History (on-chain)
                      </h3>
                    </div>
                    <div className="px-6 pb-6 space-y-2">
                      {isLoadingHistory && (
                        <p className="text-sm text-on-surface-variant/50">
                          Loading records from blockchain...
                        </p>
                      )}

                      {!isLoadingHistory && historyError && (
                        <p className="text-sm text-tertiary">{historyError}</p>
                      )}

                      {!isLoadingHistory &&
                        !historyError &&
                        historyRecords.length === 0 && (
                          <p className="text-sm text-on-surface-variant/40">
                            No accessible records found for this patient.
                          </p>
                        )}

                      {!isLoadingHistory &&
                        !historyError &&
                        historyRecords.map((record) => (
                          <div
                            key={record.id}
                            className="flex items-center gap-4 p-4 rounded-xl bg-surface-container-high/20 hover:bg-surface-container-high/40 transition-colors"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium text-on-surface">
                                {record.recordType}
                              </p>
                              <p className="text-[0.65rem] text-on-surface-variant/40 mt-0.5">
                                Provider {shortHex(record.providerAddress)} ·{" "}
                                {formatDate(record.timestamp)} · v
                                {record.version}
                              </p>
                            </div>
                            <span className="text-[0.6rem] font-mono text-on-surface-variant/25">
                              {shortHex(record.integrityHash)}
                            </span>
                            <span className="label-sm px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                              verified
                            </span>
                          </div>
                        ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === "record" && (
                  <motion.div
                    key="record"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="card p-6"
                  >
                    <h3 className="text-sm font-bold text-on-surface font-headline mb-6 flex items-center gap-2">
                      <Plus size={16} className="text-primary" />
                      Create New Record
                    </h3>
                    <div className="space-y-5">
                      <div>
                        <label className="label-sm text-primary mb-2 block">
                          Record Type
                        </label>
                        <select
                          className="input-vault"
                          value={recordType}
                          onChange={(event) =>
                            setRecordType(event.target.value as RecordTypeLabel)
                          }
                        >
                          {RECORD_TYPES.map((type) => (
                            <option key={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="label-sm text-primary mb-2 block">
                          Clinical Notes
                        </label>
                        <textarea
                          rows={5}
                          value={clinicalNotes}
                          onChange={(event) =>
                            setClinicalNotes(event.target.value)
                          }
                          className="input-vault resize-none"
                          placeholder="Enter clinical observations, diagnosis, and treatment plan..."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="label-sm text-primary mb-2 block">
                            ICD-10 Code
                          </label>
                          <input
                            value={icdCode}
                            onChange={(event) => setIcdCode(event.target.value)}
                            className="input-vault"
                            placeholder="e.g. I10"
                          />
                        </div>
                        <div>
                          <label className="label-sm text-primary mb-2 block">
                            Priority
                          </label>
                          <select
                            className="input-vault"
                            value={priority}
                            onChange={(event) =>
                              setPriority(event.target.value)
                            }
                          >
                            <option>Routine</option>
                            <option>Urgent</option>
                            <option>Critical</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-4 bg-surface-container-high/20 rounded-xl">
                        <ShieldCheck
                          size={16}
                          className="text-primary mt-0.5 shrink-0"
                        />
                        <p className="text-xs text-on-surface-variant/40">
                          Clinical details are encrypted in-browser, uploaded to
                          IPFS, and only the CID plus integrity hash is
                          committed on-chain.
                        </p>
                      </div>
                      <button
                        onClick={handleSubmitRecord}
                        disabled={isSubmittingRecord}
                        className="btn-primary w-full py-4 disabled:opacity-40"
                      >
                        <Send size={16} />
                        {isSubmittingRecord
                          ? "Submitting transaction..."
                          : "Sign & Commit to Blockchain"}
                      </button>
                    </div>
                  </motion.div>
                )}

                {activeTab === "prescribe" && (
                  <motion.div
                    key="prescribe"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="card p-6"
                  >
                    <h3 className="text-sm font-bold text-on-surface font-headline mb-6 flex items-center gap-2">
                      <Pill size={16} className="text-[#ffb951]" />
                      Write Prescription
                    </h3>
                    <p className="text-sm text-on-surface-variant/50 mb-6">
                      Prescription writing is still in UI-demo mode. The records
                      integration above is fully connected to the contract.
                    </p>
                    <button
                      onClick={() =>
                        toast("Prescription flow will be connected next.")
                      }
                      className="btn-secondary w-full py-4"
                    >
                      Continue with Demo Prescription
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="card p-16 text-center">
              <User
                size={48}
                className="text-on-surface-variant/15 mx-auto mb-4"
              />
              <p className="text-on-surface-variant/40 text-sm">
                Select a patient to view and create medical records
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
