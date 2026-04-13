export type UserRole =
  | 'admin'
  | 'doctor'
  | 'nurse'
  | 'pharmacist'
  | 'patient'
  | 'auditor'
  | 'researcher'
  | 'emergency'

export interface UserProfile {
  address: string
  name: string
  role: UserRole
  avatar?: string
}

export interface NavItem {
  label: string
  path: string
  icon: React.ReactNode
  roles: UserRole[]
}

export interface MedicalRecord {
  id: string
  patientAddress: string
  patientName: string
  recordType: string
  ipfsHash: string
  timestamp: number
  provider: string
  isEncrypted: boolean
}

export interface AccessGrant {
  id: string
  grantee: string
  granteeName: string
  role: UserRole
  expiresAt: number
  isActive: boolean
}

export interface AuditEntry {
  id: string
  action: string
  actor: string
  actorName: string
  target: string
  timestamp: number
  txHash: string
  blockNumber: number
}

export interface VitalSigns {
  bloodPressureSystolic: number
  bloodPressureDiastolic: number
  heartRate: number
  temperature: number
  spO2: number
  weight: number
  height: number
}

export interface Prescription {
  id: string
  patientAddress: string
  patientName: string
  medication: string
  dosage: string
  frequency: string
  prescribedBy: string
  prescribedAt: number
  isDispensed: boolean
  dispensedBy?: string
  dispensedAt?: number
}
