export enum RecordType {
  ClinicalEncounter = 0,
  LabResult = 1,
  Prescription = 2,
  Imaging = 3,
  VitalSigns = 4,
  Immunization = 5,
  SurgicalHistory = 6,
}

export const RecordTypeLabels: Record<RecordType, string> = {
  [RecordType.ClinicalEncounter]: "Clinical Encounter",
  [RecordType.LabResult]: "Lab Result",
  [RecordType.Prescription]: "Prescription",
  [RecordType.Imaging]: "Imaging",
  [RecordType.VitalSigns]: "Vital Signs",
  [RecordType.Immunization]: "Immunization",
  [RecordType.SurgicalHistory]: "Surgical History",
};

export const RecordTypeIcons: Record<RecordType, string> = {
  [RecordType.ClinicalEncounter]: "stethoscope",
  [RecordType.LabResult]: "flask",
  [RecordType.Prescription]: "pill",
  [RecordType.Imaging]: "scan",
  [RecordType.VitalSigns]: "heart-pulse",
  [RecordType.Immunization]: "syringe",
  [RecordType.SurgicalHistory]: "scissors",
};

export enum Role {
  None = 0,
  Patient = 1,
  PrimaryDoctor = 2,
  Specialist = 3,
  Nurse = 4,
  Pharmacist = 5,
  LabTechnician = 6,
  InsuranceVerifier = 7,
  HospitalAdmin = 8,
}

export const RoleLabels: Record<Role, string> = {
  [Role.None]: "None",
  [Role.Patient]: "Patient",
  [Role.PrimaryDoctor]: "Primary Doctor",
  [Role.Specialist]: "Specialist",
  [Role.Nurse]: "Nurse",
  [Role.Pharmacist]: "Pharmacist",
  [Role.LabTechnician]: "Lab Technician",
  [Role.InsuranceVerifier]: "Insurance Verifier",
  [Role.HospitalAdmin]: "Hospital Admin",
};

export enum PrescriptionStatus {
  Active = 0,
  Dispensed = 1,
  AwaitingRefill = 2,
  Expired = 3,
  Cancelled = 4,
}

export const PrescriptionStatusLabels: Record<PrescriptionStatus, string> = {
  [PrescriptionStatus.Active]: "Active",
  [PrescriptionStatus.Dispensed]: "Dispensed",
  [PrescriptionStatus.AwaitingRefill]: "Awaiting Refill",
  [PrescriptionStatus.Expired]: "Expired",
  [PrescriptionStatus.Cancelled]: "Cancelled",
};

export interface MedicalRecord {
  id: number;
  recordType: RecordType;
  patientAddress: string;
  providerAddress: string;
  ipfsCID: string;
  integrityHash: string;
  timestamp: number;
  version: number;
  isDeleted: boolean;
  decryptedData?: DecryptedRecordData;
}

export interface DecryptedRecordData {
  diagnosis?: string;
  treatment?: string;
  notes?: string;
  allergies?: string;
  bloodType?: string;
  medications?: string[];
  vitalSigns?: { systolic?: number; diastolic?: number; heartRate?: number; temperature?: number; oxygenSat?: number; weight?: number; height?: number };
  labValues?: Record<string, string>;
  vaccineName?: string;
  doseNumber?: number;
  procedureName?: string;
}

export interface AuditEntry {
  accessor: string;
  recordId: number;
  action: string;
  timestamp: number;
  isEmergency: boolean;
}

export interface PrescriptionData {
  id: number;
  recordId: number;
  prescriber: string;
  dispensedBy: string;
  status: PrescriptionStatus;
  refillsRemaining: number;
  expiresAt: number;
  ipfsCID: string;
}

export type ActiveView = "dashboard" | "records" | "prescriptions" | "access" | "audit" | "admin" | "emergency";
