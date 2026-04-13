import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Search,
  Calendar,
  ShieldCheck,
  CheckCircle,
  Wallet,
} from "lucide-react";
import { isAddress } from "ethers";
import toast from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";
import {
  type ChainMedicalRecord,
  fetchPatientRecords,
  getMediChainContract,
  getContractAddress,
  hasConfiguredContract,
} from "../utils/medichainContract";
import { decryptRecordFromCid } from "../utils/ipfsUpload";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4 },
});

const TYPE_COLORS: Record<string, string> = {
  "Clinical Encounter": "bg-primary/10 text-primary",
  "Lab Result": "bg-secondary/10 text-secondary",
  Imaging: "bg-[#2d3449] text-[#d0bcff]",
  Prescription: "bg-[#412d00] text-[#ffb951]",
  "Vital Signs": "bg-primary/10 text-primary",
  Immunization: "bg-secondary/10 text-secondary",
  "Surgical History": "bg-tertiary/10 text-tertiary",
};

function shortHex(value: string): string {
  if (value.length < 12) {
    return value;
  }

  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function readableDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString();
}

export default function RecordsPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [patientAddress, setPatientAddress] = useState("");
  const [records, setRecords] = useState<ChainMedicalRecord[]>([]);
  const [selectedRecord, setSelectedRecord] =
    useState<ChainMedicalRecord | null>(null);
  const [decryptedPayload, setDecryptedPayload] = useState<unknown | null>(
    null,
  );
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user?.address && isAddress(user.address)) {
      setPatientAddress(user.address);
    }
  }, [user?.address]);

  const loadRecords = async (addressToLoad: string) => {
    if (!isAddress(addressToLoad)) {
      setErrorMessage("Enter a valid wallet address.");
      setRecords([]);
      setSelectedRecord(null);
      return;
    }

    if (!hasConfiguredContract()) {
      setErrorMessage(
        "Contract address missing. Add VITE_MEDICHAIN_CONTRACT_ADDRESS to .env.",
      );
      setRecords([]);
      setSelectedRecord(null);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const contract = await getMediChainContract(false);
      const chainRecords = await fetchPatientRecords(contract, addressToLoad);
      setRecords(chainRecords);
      setSelectedRecord(chainRecords[0] ?? null);
      setDecryptedPayload(null);
      setDecryptError(null);

      if (!chainRecords.length) {
        toast("No accessible records were found for this patient wallet.");
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to load records from blockchain.";
      setErrorMessage(message);
      setRecords([]);
      setSelectedRecord(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (patientAddress && isAddress(patientAddress)) {
      void loadRecords(patientAddress);
    }
  }, [patientAddress]);

  useEffect(() => {
    if (!selectedRecord) {
      setDecryptedPayload(null);
      setDecryptError(null);
      return;
    }

    const loadDecryptedPayload = async () => {
      setIsDecrypting(true);
      setDecryptError(null);
      setDecryptedPayload(null);

      try {
        const result = await decryptRecordFromCid(selectedRecord.ipfsCID);

        if (
          selectedRecord.integrityHash.toLowerCase() !==
          result.computedHash.toLowerCase()
        ) {
          throw new Error(
            "Integrity hash mismatch detected. This payload does not match on-chain metadata.",
          );
        }

        setDecryptedPayload(result.payload);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to decrypt IPFS payload.";
        setDecryptError(message);
      } finally {
        setIsDecrypting(false);
      }
    };

    void loadDecryptedPayload();
  }, [selectedRecord]);

  const filteredRecords = useMemo(
    () =>
      records.filter(
        (record) =>
          record.recordType.toLowerCase().includes(search.toLowerCase()) ||
          record.providerAddress.toLowerCase().includes(search.toLowerCase()) ||
          record.ipfsCID.toLowerCase().includes(search.toLowerCase()),
      ),
    [records, search],
  );

  return (
    <div className="space-y-6">
      <motion.div {...fadeUp(0)}>
        <h1 className="text-2xl font-extrabold text-on-surface font-headline">
          Health History
        </h1>
        <p className="text-sm text-on-surface-variant/50 mt-1">
          Verified records from the MediChain contract
        </p>
      </motion.div>

      <motion.div {...fadeUp(0.05)} className="card p-4 md:p-5">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
          <div className="relative">
            <Wallet
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/30"
            />
            <input
              value={patientAddress}
              onChange={(event) => setPatientAddress(event.target.value)}
              placeholder="Patient wallet address (0x...)"
              className="input-vault pl-11 font-mono text-sm"
            />
          </div>
          <button
            onClick={() => void loadRecords(patientAddress)}
            disabled={isLoading}
            className="btn-primary py-2.5 px-4 text-xs disabled:opacity-40"
          >
            {isLoading ? "Loading..." : "Load On-Chain Records"}
          </button>
        </div>
        <p className="text-[0.65rem] text-on-surface-variant/35 mt-2">
          Contract:{" "}
          {hasConfiguredContract() ? getContractAddress() : "Not configured"}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <motion.div {...fadeUp(0.1)} className="lg:col-span-7 space-y-4">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/30"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Filter records by type/provider/hash..."
              className="input-vault pl-11"
            />
          </div>

          {errorMessage && (
            <p className="text-sm text-tertiary">{errorMessage}</p>
          )}

          {!errorMessage && !isLoading && filteredRecords.length === 0 && (
            <p className="text-sm text-on-surface-variant/40">
              No records to display.
            </p>
          )}

          {filteredRecords.map((record, index) => (
            <motion.button
              key={record.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              onClick={() => setSelectedRecord(record)}
              className={`w-full text-left card p-5 transition-all duration-200 ${
                selectedRecord?.id === record.id
                  ? "ring-1 ring-primary/20"
                  : "hover:shadow-[0px_20px_60px_rgba(0,0,0,0.5)]"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`label-sm px-2.5 py-1 rounded-full ${TYPE_COLORS[record.recordType] || "bg-surface-variant text-on-surface-variant"}`}
                  >
                    {record.recordType}
                  </span>
                  <span className="text-xs text-on-surface-variant/30 flex items-center gap-1">
                    <Calendar size={11} /> {readableDate(record.timestamp)}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-primary">
                  <CheckCircle size={12} />
                  <span className="text-[0.6rem] font-medium">Verified</span>
                </div>
              </div>
              <p className="text-sm text-on-surface mb-2">
                IPFS CID: {record.ipfsCID}
              </p>
              <div className="flex items-center justify-between">
                <p className="text-[0.65rem] text-on-surface-variant/30">
                  Provider {shortHex(record.providerAddress)} · Version{" "}
                  {record.version}
                </p>
                <span className="text-[0.6rem] font-mono text-on-surface-variant/20">
                  {shortHex(record.integrityHash)}
                </span>
              </div>
            </motion.button>
          ))}
        </motion.div>

        <motion.div {...fadeUp(0.2)} className="lg:col-span-5 space-y-6">
          {selectedRecord ? (
            <div className="card p-6">
              <h3 className="text-sm font-bold text-on-surface font-headline mb-4 flex items-center gap-2">
                <FileText size={16} className="text-primary" />
                Record Detail
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant/50">Record ID</span>
                  <span className="text-on-surface font-medium">
                    #{selectedRecord.id}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant/50">Type</span>
                  <span className="text-on-surface font-medium">
                    {selectedRecord.recordType}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant/50">Patient</span>
                  <span className="text-on-surface font-mono text-xs">
                    {shortHex(selectedRecord.patientAddress)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant/50">Provider</span>
                  <span className="text-on-surface font-mono text-xs">
                    {shortHex(selectedRecord.providerAddress)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant/50">IPFS CID</span>
                  <span className="text-on-surface font-mono text-xs">
                    {selectedRecord.ipfsCID}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant/50">
                    Integrity Hash
                  </span>
                  <span className="text-on-surface font-mono text-xs">
                    {shortHex(selectedRecord.integrityHash)}
                  </span>
                </div>
                <div className="pt-2 flex items-center gap-1 text-primary text-xs">
                  <ShieldCheck size={14} />
                  <span>
                    Stored on smart contract and access-controlled by patient
                    permissions
                  </span>
                </div>
                <div className="pt-3 border-t border-outline-variant/[0.08]">
                  <p className="text-on-surface-variant/50 text-sm mb-2">
                    Decrypted Payload
                  </p>
                  {isDecrypting && (
                    <p className="text-xs text-on-surface-variant/40">
                      Fetching and decrypting IPFS payload...
                    </p>
                  )}
                  {!isDecrypting && decryptError && (
                    <p className="text-xs text-tertiary">{decryptError}</p>
                  )}
                  {!isDecrypting &&
                    !decryptError &&
                    decryptedPayload !== null && (
                      <pre className="text-xs text-on-surface bg-surface-container-lowest p-3 rounded-lg overflow-x-auto whitespace-pre-wrap break-words">
                        {JSON.stringify(decryptedPayload, null, 2)}
                      </pre>
                    )}
                </div>
              </div>
            </div>
          ) : (
            <div className="card p-6 text-sm text-on-surface-variant/40">
              Select a record to inspect its metadata.
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
