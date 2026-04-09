// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "../libraries/RecordTypes.sol";

/**
 * @title MediChainCore
 * @author Sam MUGABO - MediChain v2.1
 * @notice Decentralized medical records management with RBAC, 
 *         audit trails, prescriptions, and emergency access.
 * @dev Deployed on Polygon L2. All sensitive data stored encrypted on IPFS;
 *      only CIDs and integrity hashes stored on-chain.
 */
contract MediChainCore is AccessControl, ReentrancyGuard, Pausable {

    // ═══════════════════════════════════════════
    //  ROLES
    // ═══════════════════════════════════════════

    bytes32 public constant DOCTOR_ROLE = keccak256("DOCTOR_ROLE");
    bytes32 public constant NURSE_ROLE = keccak256("NURSE_ROLE");
    bytes32 public constant PHARMACIST_ROLE = keccak256("PHARMACIST_ROLE");
    bytes32 public constant LAB_ROLE = keccak256("LAB_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // ═══════════════════════════════════════════
    //  STATE VARIABLES
    // ═══════════════════════════════════════════

    uint256 private _recordCounter;
    uint256 private _prescriptionCounter;

    // Records
    mapping(uint256 => RecordTypes.Record) public records;
    mapping(address => uint256[]) private _patientRecordIds;

    // Access control: patient => grantee => recordId => AccessGrant
    mapping(address => mapping(address => mapping(uint256 => RecordTypes.AccessGrant))) public accessGrants;

    // Rate limiting on grants
    mapping(address => uint256) public lastGrantTimestamp;
    uint256 public constant GRANT_COOLDOWN = 60;

    // Audit trail
    RecordTypes.AuditEntry[] private _auditLog;
    mapping(uint256 => uint256[]) private _recordAuditIndices;

    // Prescriptions
    mapping(uint256 => RecordTypes.Prescription) public prescriptions;
    mapping(address => uint256[]) private _patientPrescriptionIds;

    // Death protocol
    mapping(address => bool) public isDeceased;
    mapping(address => address) public recordExecutor;

    // Retention policies (recordType => minimum seconds before deletion)
    mapping(RecordTypes.RecordType => uint256) public minRetention;

    // ═══════════════════════════════════════════
    //  EVENTS
    // ═══════════════════════════════════════════

    event RecordAdded(
        uint256 indexed id,
        address indexed patient,
        address indexed provider,
        RecordTypes.RecordType recordType
    );

    event RecordUpdated(
        uint256 indexed id,
        address indexed updatedBy,
        uint256 version
    );

    event RecordDeleted(
        uint256 indexed id,
        address indexed deletedBy
    );

    event AccessGranted(
        address indexed patient,
        address indexed grantee,
        uint256 recordId,
        uint256 expiresAt
    );

    event AccessRevoked(
        address indexed patient,
        address indexed grantee,
        uint256 recordId
    );

    event FailedAccessAttempt(
        address indexed requester,
        address indexed patient,
        uint256 indexed recordId,
        string reason
    );

    event PrescriptionWritten(
        uint256 indexed prescriptionId,
        address indexed patient,
        address indexed prescriber
    );

    event PrescriptionDispensed(
        uint256 indexed prescriptionId,
        address indexed pharmacist
    );

    event EmergencyAccess(
        address indexed accessor,
        address indexed patient,
        uint256 timestamp
    );

    event PatientDeceased(
        address indexed patient,
        address indexed executor,
        uint256 timestamp
    );

    event AuditLogged(
        address indexed accessor,
        uint256 indexed recordId,
        string action
    );

    // ═══════════════════════════════════════════
    //  CONSTRUCTOR
    // ═══════════════════════════════════════════

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);

        // Default retention policies (Rwanda medical records law)
        // 10 years for general records
        minRetention[RecordTypes.RecordType.ClinicalEncounter] = 315_360_000;
        minRetention[RecordTypes.RecordType.LabResult] = 315_360_000;
        minRetention[RecordTypes.RecordType.VitalSigns] = 315_360_000;
        minRetention[RecordTypes.RecordType.Immunization] = 315_360_000;
        minRetention[RecordTypes.RecordType.Imaging] = 315_360_000;
        // 30 years for surgical records
        minRetention[RecordTypes.RecordType.SurgicalHistory] = 946_080_000;
        // 5 years for prescriptions
        minRetention[RecordTypes.RecordType.Prescription] = 157_680_000;
    }

    // ═══════════════════════════════════════════
    //  MODIFIERS
    // ═══════════════════════════════════════════

    modifier onlyPatientOf(uint256 _recordId) {
        require(
            records[_recordId].patientAddress == msg.sender,
            "Not the patient"
        );
        _;
    }

    modifier recordExists(uint256 _recordId) {
        require(
            _recordId > 0 && _recordId <= _recordCounter,
            "Record does not exist"
        );
        require(!records[_recordId].isDeleted, "Record is deleted");
        _;
    }

    modifier notDeceased(address _patient) {
        require(!isDeceased[_patient], "Patient is deceased");
        _;
    }

    // ═══════════════════════════════════════════
    //  CORE RECORD FUNCTIONS
    // ═══════════════════════════════════════════

    /**
     * @notice Add a new medical record
     * @param _patient Patient's wallet address
     * @param _recordType Type of medical record
     * @param _ipfsCID IPFS content ID of encrypted data
     * @param _integrityHash keccak256 hash of encrypted data for tamper detection
     * @return The new record's ID
     */
    function addRecord(
        address _patient,
        RecordTypes.RecordType _recordType,
        string calldata _ipfsCID,
        bytes32 _integrityHash
    )
        external
        nonReentrant
        whenNotPaused
        notDeceased(_patient)
        returns (uint256)
    {
        require(_patient != address(0), "Invalid patient address");
        require(bytes(_ipfsCID).length > 0, "IPFS CID required");
        require(_integrityHash != bytes32(0), "Integrity hash required");
        require(
            msg.sender == _patient ||
            hasRole(DOCTOR_ROLE, msg.sender) ||
            hasRole(NURSE_ROLE, msg.sender) ||
            hasRole(LAB_ROLE, msg.sender),
            "Not authorized to add records"
        );

        _recordCounter++;
        uint256 newId = _recordCounter;

        records[newId] = RecordTypes.Record({
            id: newId,
            recordType: _recordType,
            patientAddress: _patient,
            providerAddress: msg.sender,
            ipfsCID: _ipfsCID,
            integrityHash: _integrityHash,
            timestamp: block.timestamp,
            version: 1,
            isDeleted: false
        });

        _patientRecordIds[_patient].push(newId);
        _logAudit(msg.sender, newId, "CREATE", false);

        emit RecordAdded(newId, _patient, msg.sender, _recordType);
        return newId;
    }

    /**
     * @notice Retrieve a record (with access check + audit logging)
     * @param _recordId The record to retrieve
     * @return The record data
     */
    function getRecord(uint256 _recordId)
        external
        recordExists(_recordId)
        returns (RecordTypes.Record memory)
    {
        if (!_checkAccess(msg.sender, _recordId)) {
            emit FailedAccessAttempt(
                msg.sender,
                records[_recordId].patientAddress,
                _recordId,
                "No valid access grant"
            );
            revert("Not authorized to access this record");
        }

        _logAudit(msg.sender, _recordId, "READ", false);
        return records[_recordId];
    }

    /**
     * @notice Check access without state changes (view function for frontend)
     * @param _recordId The record to check
     * @return hasPermission Whether the caller has access
     * @return reason Explanation if denied
     */
    function checkAccess(uint256 _recordId)
        external
        view
        returns (bool hasPermission, string memory reason)
    {
        if (_recordId == 0 || _recordId > _recordCounter)
            return (false, "Record does not exist");
        if (records[_recordId].isDeleted)
            return (false, "Record is deleted");
        if (!_checkAccess(msg.sender, _recordId))
            return (false, "No valid access grant");
        return (true, "");
    }

    /**
     * @notice Update a record's IPFS data (creates new version)
     * @param _recordId The record to update
     * @param _newIpfsCID New IPFS content ID
     * @param _newIntegrityHash New integrity hash
     */
    function updateRecord(
        uint256 _recordId,
        string calldata _newIpfsCID,
        bytes32 _newIntegrityHash
    )
        external
        recordExists(_recordId)
        nonReentrant
        whenNotPaused
    {
        require(bytes(_newIpfsCID).length > 0, "IPFS CID required");
        require(_newIntegrityHash != bytes32(0), "Integrity hash required");

        RecordTypes.Record storage record = records[_recordId];

        require(
            msg.sender == record.providerAddress ||
            msg.sender == record.patientAddress ||
            hasRole(DOCTOR_ROLE, msg.sender),
            "Not authorized to update"
        );

        record.ipfsCID = _newIpfsCID;
        record.integrityHash = _newIntegrityHash;
        record.version++;

        _logAudit(msg.sender, _recordId, "UPDATE", false);
        emit RecordUpdated(_recordId, msg.sender, record.version);
    }

    /**
     * @notice Soft-delete a record (patient only, respects retention policy)
     * @param _recordId The record to delete
     */
    function softDeleteRecord(uint256 _recordId)
        external
        recordExists(_recordId)
        onlyPatientOf(_recordId)
        nonReentrant
    {
        RecordTypes.Record storage record = records[_recordId];
        uint256 minAge = minRetention[record.recordType];

        require(
            block.timestamp >= record.timestamp + minAge,
            "Record within minimum retention period"
        );

        record.isDeleted = true;
        _logAudit(msg.sender, _recordId, "DELETE", false);
        emit RecordDeleted(_recordId, msg.sender);
    }

    /**
     * @notice Get patient's record IDs (paginated to avoid gas limits)
     * @param _patient Patient address
     * @param _offset Starting index
     * @param _limit Max records to return
     * @return ids Array of record IDs
     * @return total Total number of records for this patient
     */
    function getPatientRecordIds(
        address _patient,
        uint256 _offset,
        uint256 _limit
    )
        external
        view
        returns (uint256[] memory ids, uint256 total)
    {
        uint256[] storage allIds = _patientRecordIds[_patient];
        total = allIds.length;

        if (_offset >= total) return (new uint256[](0), total);

        uint256 end = _offset + _limit;
        if (end > total) end = total;

        ids = new uint256[](end - _offset);
        for (uint256 i = _offset; i < end; i++) {
            ids[i - _offset] = allIds[i];
        }
    }

    /**
     * @notice Get total record count
     */
    function getRecordCount() external view returns (uint256) {
        return _recordCounter;
    }

    // ═══════════════════════════════════════════
    //  ACCESS CONTROL
    // ═══════════════════════════════════════════

    /**
     * @notice Grant time-limited access to a record (or all records)
     * @param _grantee Address receiving access
     * @param _recordId Specific record (0 = all records)
     * @param _role Role to assign
     * @param _durationSeconds How long the access lasts
     */
    function grantAccess(
        address _grantee,
        uint256 _recordId,
        RecordTypes.Role _role,
        uint256 _durationSeconds
    )
        external
        notDeceased(msg.sender)
    {
        require(_grantee != address(0), "Invalid grantee");
        require(_grantee != msg.sender, "Cannot grant to self");
        require(_durationSeconds > 0, "Duration must be positive");
        require(_durationSeconds <= 365 days, "Max 1 year grant");

        // Rate limiting
        require(
            block.timestamp >= lastGrantTimestamp[msg.sender] + GRANT_COOLDOWN,
            "Grant cooldown: wait 60 seconds"
        );
        lastGrantTimestamp[msg.sender] = block.timestamp;

        // Verify ownership for per-record grants
        if (_recordId > 0) {
            require(
                records[_recordId].patientAddress == msg.sender,
                "Not your record"
            );
        }

        uint256 expiresAt = block.timestamp + _durationSeconds;

        accessGrants[msg.sender][_grantee][_recordId] = RecordTypes.AccessGrant({
            grantee: _grantee,
            role: _role,
            recordId: _recordId,
            expiresAt: expiresAt,
            isActive: true
        });

        _logAudit(msg.sender, _recordId, "GRANT", false);
        emit AccessGranted(msg.sender, _grantee, _recordId, expiresAt);
    }

    /**
     * @notice Revoke access to a record
     * @param _grantee Address losing access
     * @param _recordId Specific record (0 = blanket revoke)
     */
    function revokeAccess(
        address _grantee,
        uint256 _recordId
    ) external {
        if (_recordId > 0) {
            require(
                records[_recordId].patientAddress == msg.sender,
                "Not your record"
            );
        }

        accessGrants[msg.sender][_grantee][_recordId].isActive = false;
        _logAudit(msg.sender, _recordId, "REVOKE", false);
        emit AccessRevoked(msg.sender, _grantee, _recordId);
    }

    /**
     * @notice Emergency break-glass access (clinical staff only)
     * @param _patient Patient whose records are needed
     */
    function emergencyAccess(address _patient)
        external
        nonReentrant
    {
        require(
            hasRole(DOCTOR_ROLE, msg.sender) ||
            hasRole(NURSE_ROLE, msg.sender),
            "Only clinical staff for emergency access"
        );

        // Grant 24-hour blanket access
        accessGrants[_patient][msg.sender][0] = RecordTypes.AccessGrant({
            grantee: msg.sender,
            role: RecordTypes.Role.PrimaryDoctor,
            recordId: 0,
            expiresAt: block.timestamp + 24 hours,
            isActive: true
        });

        _logAudit(msg.sender, 0, "EMERGENCY_ACCESS", true);
        emit EmergencyAccess(msg.sender, _patient, block.timestamp);
    }

    // ═══════════════════════════════════════════
    //  PRESCRIPTIONS
    // ═══════════════════════════════════════════

    /**
     * @notice Write a new prescription
     * @param _patient Patient address
     * @param _ipfsCID Encrypted prescription details on IPFS
     * @param _refills Number of refills allowed
     * @param _validDays How many days the prescription is valid
     * @return prescriptionId The new prescription's ID
     */
    function writePrescription(
        address _patient,
        string calldata _ipfsCID,
        uint8 _refills,
        uint256 _validDays
    )
        external
        nonReentrant
        whenNotPaused
        notDeceased(_patient)
        returns (uint256)
    {
        require(hasRole(DOCTOR_ROLE, msg.sender), "Only doctors can prescribe");
        require(_patient != address(0), "Invalid patient");
        require(bytes(_ipfsCID).length > 0, "IPFS CID required");
        require(_validDays > 0 && _validDays <= 365, "Valid days: 1-365");

        // Create the underlying record
        _recordCounter++;
        uint256 recordId = _recordCounter;
        bytes32 integrityHash = keccak256(abi.encodePacked(_ipfsCID, block.timestamp));

        records[recordId] = RecordTypes.Record({
            id: recordId,
            recordType: RecordTypes.RecordType.Prescription,
            patientAddress: _patient,
            providerAddress: msg.sender,
            ipfsCID: _ipfsCID,
            integrityHash: integrityHash,
            timestamp: block.timestamp,
            version: 1,
            isDeleted: false
        });
        _patientRecordIds[_patient].push(recordId);

        // Create prescription entry
        _prescriptionCounter++;
        uint256 rxId = _prescriptionCounter;

        prescriptions[rxId] = RecordTypes.Prescription({
            id: rxId,
            recordId: recordId,
            prescriber: msg.sender,
            dispensedBy: address(0),
            status: RecordTypes.PrescriptionStatus.Active,
            refillsRemaining: _refills,
            expiresAt: block.timestamp + (_validDays * 1 days),
            ipfsCID: _ipfsCID
        });
        _patientPrescriptionIds[_patient].push(rxId);

        _logAudit(msg.sender, recordId, "PRESCRIBE", false);
        emit PrescriptionWritten(rxId, _patient, msg.sender);
        return rxId;
    }

    /**
     * @notice Dispense a prescription (pharmacist only)
     * @param _rxId Prescription ID to dispense
     */
    function dispensePrescription(uint256 _rxId)
        external
        nonReentrant
        whenNotPaused
    {
        require(hasRole(PHARMACIST_ROLE, msg.sender), "Only pharmacists");

        RecordTypes.Prescription storage rx = prescriptions[_rxId];
        require(rx.id > 0, "Prescription not found");
        require(
            rx.status == RecordTypes.PrescriptionStatus.Active ||
            rx.status == RecordTypes.PrescriptionStatus.AwaitingRefill,
            "Cannot dispense: invalid status"
        );
        require(block.timestamp < rx.expiresAt, "Prescription expired");

        rx.dispensedBy = msg.sender;

        if (rx.refillsRemaining > 0) {
            rx.refillsRemaining--;
            rx.status = RecordTypes.PrescriptionStatus.AwaitingRefill;
        } else {
            rx.status = RecordTypes.PrescriptionStatus.Dispensed;
        }

        _logAudit(msg.sender, rx.recordId, "DISPENSE", false);
        emit PrescriptionDispensed(_rxId, msg.sender);
    }

    /**
     * @notice Get prescription details
     */
    function getPrescription(uint256 _rxId)
        external
        view
        returns (RecordTypes.Prescription memory)
    {
        require(prescriptions[_rxId].id > 0, "Prescription not found");
        return prescriptions[_rxId];
    }

    /**
     * @notice Get patient's prescription IDs (paginated)
     */
    function getPatientPrescriptionIds(
        address _patient,
        uint256 _offset,
        uint256 _limit
    )
        external
        view
        returns (uint256[] memory ids, uint256 total)
    {
        uint256[] storage allIds = _patientPrescriptionIds[_patient];
        total = allIds.length;
        if (_offset >= total) return (new uint256[](0), total);
        uint256 end = _offset + _limit;
        if (end > total) end = total;
        ids = new uint256[](end - _offset);
        for (uint256 i = _offset; i < end; i++) {
            ids[i - _offset] = allIds[i];
        }
    }

    // ═══════════════════════════════════════════
    //  AUDIT TRAIL
    // ═══════════════════════════════════════════

    /**
     * @notice Get audit trail for a specific record
     * @param _recordId Record to get audit for
     * @return entries Array of audit entries
     */
    function getAuditTrail(uint256 _recordId)
        external
        view
        returns (RecordTypes.AuditEntry[] memory entries)
    {
        uint256[] storage indices = _recordAuditIndices[_recordId];
        entries = new RecordTypes.AuditEntry[](indices.length);
        for (uint256 i = 0; i < indices.length; i++) {
            entries[i] = _auditLog[indices[i]];
        }
    }

    /**
     * @notice Get total audit log size
     */
    function getAuditLogSize() external view returns (uint256) {
        return _auditLog.length;
    }

    // ═══════════════════════════════════════════
    //  DEATH PROTOCOL
    // ═══════════════════════════════════════════

    /**
     * @notice Declare a patient as deceased (admin only)
     * @param _patient Patient address
     * @param _executor Legal executor who inherits record access
     */
    function declareDeceased(
        address _patient,
        address _executor
    ) external onlyRole(ADMIN_ROLE) {
        require(!isDeceased[_patient], "Already declared deceased");
        require(_executor != address(0), "Executor address required");
        require(_patient != _executor, "Executor cannot be patient");

        isDeceased[_patient] = true;
        recordExecutor[_patient] = _executor;

        _logAudit(msg.sender, 0, "DECLARE_DECEASED", false);
        emit PatientDeceased(_patient, _executor, block.timestamp);
    }

    // ═══════════════════════════════════════════
    //  ADMIN FUNCTIONS
    // ═══════════════════════════════════════════

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    function registerDoctor(address _doctor) external onlyRole(ADMIN_ROLE) {
        require(_doctor != address(0), "Invalid address");
        grantRole(DOCTOR_ROLE, _doctor);
    }

    function registerNurse(address _nurse) external onlyRole(ADMIN_ROLE) {
        require(_nurse != address(0), "Invalid address");
        grantRole(NURSE_ROLE, _nurse);
    }

    function registerPharmacist(address _pharmacist) external onlyRole(ADMIN_ROLE) {
        require(_pharmacist != address(0), "Invalid address");
        grantRole(PHARMACIST_ROLE, _pharmacist);
    }

    function registerLabTech(address _labTech) external onlyRole(ADMIN_ROLE) {
        require(_labTech != address(0), "Invalid address");
        grantRole(LAB_ROLE, _labTech);
    }

    /**
     * @notice Update retention policy for a record type (admin only)
     */
    function setRetentionPolicy(
        RecordTypes.RecordType _recordType,
        uint256 _minSeconds
    ) external onlyRole(ADMIN_ROLE) {
        require(_minSeconds > 0, "Retention must be positive");
        minRetention[_recordType] = _minSeconds;
    }

    // ═══════════════════════════════════════════
    //  INTERNAL FUNCTIONS
    // ═══════════════════════════════════════════

    /**
     * @dev Check if an address has access to a record
     */
    function _checkAccess(
        address _user,
        uint256 _recordId
    ) internal view returns (bool) {
        address patient = records[_recordId].patientAddress;

        // Deceased patient: only executor + admin
        if (isDeceased[patient]) {
            return _user == recordExecutor[patient] ||
                hasRole(ADMIN_ROLE, _user);
        }

        // Patient always has access
        if (patient == _user) return true;

        // Provider who created the record
        if (records[_recordId].providerAddress == _user) return true;

        // Per-record grant (check active + not expired)
        RecordTypes.AccessGrant memory grant = accessGrants[patient][_user][_recordId];
        if (grant.isActive && block.timestamp < grant.expiresAt) {
            return true;
        }

        // Blanket grant (recordId = 0)
        RecordTypes.AccessGrant memory blanket = accessGrants[patient][_user][0];
        if (blanket.isActive && block.timestamp < blanket.expiresAt) {
            return true;
        }

        // Admin role
        if (hasRole(ADMIN_ROLE, _user)) return true;

        return false;
    }

    /**
     * @dev Log an audit entry
     */
    function _logAudit(
        address _accessor,
        uint256 _recordId,
        string memory _action,
        bool _isEmergency
    ) internal {
        uint256 index = _auditLog.length;
        _auditLog.push(RecordTypes.AuditEntry({
            accessor: _accessor,
            recordId: _recordId,
            action: _action,
            timestamp: block.timestamp,
            isEmergency: _isEmergency
        }));

        if (_recordId > 0) {
            _recordAuditIndices[_recordId].push(index);
        }

        emit AuditLogged(_accessor, _recordId, _action);
    }
}
