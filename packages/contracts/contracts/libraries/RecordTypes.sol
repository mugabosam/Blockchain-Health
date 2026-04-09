// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title RecordTypes
 * @author Sam MUGABO - MediChain v2.1
 * @notice Shared data structures for the MediChain medical records system
 */
library RecordTypes {

    // ═══════════════════════════════════════════
    //  ENUMS
    // ═══════════════════════════════════════════

    enum RecordType {
        ClinicalEncounter,   // 0
        LabResult,           // 1
        Prescription,        // 2
        Imaging,             // 3
        VitalSigns,          // 4
        Immunization,        // 5
        SurgicalHistory      // 6
    }

    enum Role {
        None,                // 0
        Patient,             // 1
        PrimaryDoctor,       // 2
        Specialist,          // 3
        Nurse,               // 4
        Pharmacist,          // 5
        LabTechnician,       // 6
        InsuranceVerifier,   // 7
        HospitalAdmin        // 8
    }

    enum PrescriptionStatus {
        Active,              // 0
        Dispensed,           // 1
        AwaitingRefill,      // 2
        Expired,             // 3
        Cancelled            // 4
    }

    // ═══════════════════════════════════════════
    //  STRUCTS
    // ═══════════════════════════════════════════

    /// @notice Core medical record stored on-chain
    struct Record {
        uint256 id;
        RecordType recordType;
        address patientAddress;
        address providerAddress;
        string ipfsCID;             // Encrypted data pointer on IPFS
        bytes32 integrityHash;      // keccak256 of encrypted data for tamper detection
        uint256 timestamp;
        uint256 version;
        bool isDeleted;
    }

    /// @notice Access permission granted by a patient
    struct AccessGrant {
        address grantee;
        Role role;
        uint256 recordId;           // 0 = blanket access to all records
        uint256 expiresAt;          // Unix timestamp
        bool isActive;
    }

    /// @notice Immutable audit log entry
    struct AuditEntry {
        address accessor;
        uint256 recordId;
        string action;              // CREATE, READ, UPDATE, DELETE, GRANT, REVOKE, EMERGENCY_ACCESS, PRESCRIBE, DISPENSE
        uint256 timestamp;
        bool isEmergency;
    }

    /// @notice Prescription lifecycle record
    struct Prescription {
        uint256 id;
        uint256 recordId;           // Links to parent Record
        address prescriber;
        address dispensedBy;
        PrescriptionStatus status;
        uint8 refillsRemaining;
        uint256 expiresAt;
        string ipfsCID;             // Encrypted medication details on IPFS
    }
}
