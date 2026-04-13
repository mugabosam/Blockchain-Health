import { BrowserProvider, Contract, isAddress, keccak256, toUtf8Bytes, type Eip1193Provider } from 'ethers'

const MEDICHAIN_ABI = [
 'function addRecord(address _patient, uint8 _recordType, string _ipfsCID, bytes32 _integrityHash) external returns (uint256)',
 'function getPatientRecordIds(address _patient, uint256 _offset, uint256 _limit) external view returns (uint256[] ids, uint256 total)',
 'function getRecord(uint256 _recordId) external returns (tuple(uint256 id, uint8 recordType, address patientAddress, address providerAddress, string ipfsCID, bytes32 integrityHash, uint256 timestamp, uint256 version, bool isDeleted))',
]

const RECORD_TYPE_LABELS = [
 'Clinical Encounter',
 'Lab Result',
 'Prescription',
 'Imaging',
 'Vital Signs',
 'Immunization',
 'Surgical History',
] as const

export type RecordTypeLabel = (typeof RECORD_TYPE_LABELS)[number]

export interface ChainMedicalRecord {
 id: string
 patientAddress: string
 providerAddress: string
 recordType: RecordTypeLabel
 ipfsCID: string
 integrityHash: string
 timestamp: number
 version: number
 isDeleted: boolean
}

declare global {
 interface Window {
  ethereum?: unknown
 }
}

export function getContractAddress(): string {
 return import.meta.env.VITE_MEDICHAIN_CONTRACT_ADDRESS || ''
}

export function hasConfiguredContract(): boolean {
 const address = getContractAddress()
 return isAddress(address)
}

function getInjectedProvider(): Eip1193Provider {
 if (typeof window === 'undefined' || !window.ethereum) {
  throw new Error('MetaMask not detected. Please install MetaMask and refresh the page.')
 }

 return window.ethereum as Eip1193Provider
}

export async function getBrowserProvider(): Promise<BrowserProvider> {
 return new BrowserProvider(getInjectedProvider())
}

export async function connectWallet(): Promise<string> {
 const provider = await getBrowserProvider()
 const accounts = (await provider.send('eth_requestAccounts', [])) as string[]

 if (!accounts.length) {
  throw new Error('No wallet account is available.')
 }

 return accounts[0]
}

export async function getMediChainContract(withSigner: boolean): Promise<Contract> {
 if (!hasConfiguredContract()) {
  throw new Error('Set VITE_MEDICHAIN_CONTRACT_ADDRESS in your frontend .env file.')
 }

 const provider = await getBrowserProvider()
 const runner = withSigner ? await provider.getSigner() : provider

 return new Contract(getContractAddress(), MEDICHAIN_ABI, runner)
}

export function toRecordTypeValue(recordType: RecordTypeLabel): number {
 const index = RECORD_TYPE_LABELS.indexOf(recordType)

 if (index === -1) {
  throw new Error(`Unsupported record type: ${recordType}`)
 }

 return index
}

export function hashRecordPayload(payload: string): string {
 return keccak256(toUtf8Bytes(payload))
}

function labelForRecordType(value: number): RecordTypeLabel {
 return RECORD_TYPE_LABELS[value] || 'Clinical Encounter'
}

function mapChainRecord(record: {
 id: bigint
 recordType: number
 patientAddress: string
 providerAddress: string
 ipfsCID: string
 integrityHash: string
 timestamp: bigint
 version: bigint
 isDeleted: boolean
}): ChainMedicalRecord {
 return {
  id: record.id.toString(),
  patientAddress: record.patientAddress,
  providerAddress: record.providerAddress,
  recordType: labelForRecordType(Number(record.recordType)),
  ipfsCID: record.ipfsCID,
  integrityHash: record.integrityHash,
  timestamp: Number(record.timestamp),
  version: Number(record.version),
  isDeleted: record.isDeleted,
 }
}

export async function fetchPatientRecords(contract: Contract, patientAddress: string): Promise<ChainMedicalRecord[]> {
 const [recordIds] = (await contract.getPatientRecordIds(patientAddress, 0, 100)) as [bigint[], bigint]

 const records = await Promise.all(
  recordIds.map(async (recordId) => {
   try {
    const record = await contract.getRecord.staticCall(recordId)
    return mapChainRecord(record)
   } catch {
    return null
   }
  })
 )

 return records
  .filter((record): record is ChainMedicalRecord => record !== null && !record.isDeleted)
  .sort((a, b) => b.timestamp - a.timestamp)
}
