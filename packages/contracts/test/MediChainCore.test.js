const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("MediChainCore", function () {
  let core;
  let admin, doctor, doctor2, nurse, pharmacist, labTech, patient, patient2, stranger, executor;

  const SAMPLE_CID = "QmTestCID123456789abcdef";
  const SAMPLE_CID_2 = "QmUpdatedCID987654321xyz";
  const SAMPLE_HASH = ethers.keccak256(ethers.toUtf8Bytes("encrypted-medical-data"));
  const SAMPLE_HASH_2 = ethers.keccak256(ethers.toUtf8Bytes("updated-medical-data"));
  const THIRTY_DAYS = 30 * 24 * 60 * 60;
  const ONE_YEAR = 365 * 24 * 60 * 60;

  beforeEach(async function () {
    [admin, doctor, doctor2, nurse, pharmacist, labTech, patient, patient2, stranger, executor] =
      await ethers.getSigners();

    const MediChainCore = await ethers.getContractFactory("MediChainCore");
    core = await MediChainCore.deploy();
    await core.waitForDeployment();

    // Register providers
    await core.registerDoctor(doctor.address);
    await core.registerDoctor(doctor2.address);
    await core.registerNurse(nurse.address);
    await core.registerPharmacist(pharmacist.address);
    await core.registerLabTech(labTech.address);
  });

  // ═══════════════════════════════════════════
  //  RECORD MANAGEMENT
  // ═══════════════════════════════════════════

  describe("Record Management", function () {
    it("should allow a doctor to add a clinical encounter", async function () {
      const tx = await core.connect(doctor).addRecord(
        patient.address,
        0, // ClinicalEncounter
        SAMPLE_CID,
        SAMPLE_HASH
      );

      await expect(tx)
        .to.emit(core, "RecordAdded")
        .withArgs(1, patient.address, doctor.address, 0);

      expect(await core.getRecordCount()).to.equal(1);
    });

    it("should allow a nurse to add vital signs", async function () {
      const tx = await core.connect(nurse).addRecord(
        patient.address,
        4, // VitalSigns
        SAMPLE_CID,
        SAMPLE_HASH
      );

      await expect(tx).to.emit(core, "RecordAdded");
    });

    it("should allow a lab tech to add lab results", async function () {
      const tx = await core.connect(labTech).addRecord(
        patient.address,
        1, // LabResult
        SAMPLE_CID,
        SAMPLE_HASH
      );

      await expect(tx).to.emit(core, "RecordAdded");
    });

    it("should allow a patient to add their own record", async function () {
      const tx = await core.connect(patient).addRecord(
        patient.address,
        0,
        SAMPLE_CID,
        SAMPLE_HASH
      );

      await expect(tx).to.emit(core, "RecordAdded");
    });

    it("should reject records from unauthorized users", async function () {
      await expect(
        core.connect(stranger).addRecord(patient.address, 0, SAMPLE_CID, SAMPLE_HASH)
      ).to.be.revertedWith("Not authorized to add records");
    });

    it("should reject empty IPFS CID", async function () {
      await expect(
        core.connect(doctor).addRecord(patient.address, 0, "", SAMPLE_HASH)
      ).to.be.revertedWith("IPFS CID required");
    });

    it("should reject zero integrity hash", async function () {
      await expect(
        core.connect(doctor).addRecord(patient.address, 0, SAMPLE_CID, ethers.ZeroHash)
      ).to.be.revertedWith("Integrity hash required");
    });

    it("should reject zero address patient", async function () {
      await expect(
        core.connect(doctor).addRecord(ethers.ZeroAddress, 0, SAMPLE_CID, SAMPLE_HASH)
      ).to.be.revertedWith("Invalid patient address");
    });

    it("should allow authorized provider to update a record", async function () {
      await core.connect(doctor).addRecord(patient.address, 0, SAMPLE_CID, SAMPLE_HASH);

      const tx = await core.connect(doctor).updateRecord(1, SAMPLE_CID_2, SAMPLE_HASH_2);

      await expect(tx)
        .to.emit(core, "RecordUpdated")
        .withArgs(1, doctor.address, 2);
    });

    it("should increment version on update", async function () {
      await core.connect(doctor).addRecord(patient.address, 0, SAMPLE_CID, SAMPLE_HASH);
      await core.connect(doctor).updateRecord(1, SAMPLE_CID_2, SAMPLE_HASH_2);

      const record = await core.connect(patient).getRecord.staticCall(1);
      expect(record.version).to.equal(2);
      expect(record.ipfsCID).to.equal(SAMPLE_CID_2);
    });

    it("should return paginated record IDs", async function () {
      // Add 5 records
      for (let i = 0; i < 5; i++) {
        await core.connect(doctor).addRecord(patient.address, 0, `QmCID${i}`, SAMPLE_HASH);
      }

      const [ids, total] = await core.getPatientRecordIds(patient.address, 0, 3);
      expect(total).to.equal(5);
      expect(ids.length).to.equal(3);
      expect(ids[0]).to.equal(1);
      expect(ids[2]).to.equal(3);

      const [ids2] = await core.getPatientRecordIds(patient.address, 3, 10);
      expect(ids2.length).to.equal(2);
      expect(ids2[0]).to.equal(4);
    });

    it("should handle pagination offset beyond total", async function () {
      await core.connect(doctor).addRecord(patient.address, 0, SAMPLE_CID, SAMPLE_HASH);

      const [ids, total] = await core.getPatientRecordIds(patient.address, 100, 10);
      expect(total).to.equal(1);
      expect(ids.length).to.equal(0);
    });
  });

  // ═══════════════════════════════════════════
  //  SOFT DELETE + RETENTION
  // ═══════════════════════════════════════════

  describe("Soft Delete & Retention Policy", function () {
    it("should allow patient to soft-delete their record after retention period", async function () {
      await core.connect(doctor).addRecord(patient.address, 0, SAMPLE_CID, SAMPLE_HASH);

      // Fast-forward past 10-year retention
      await time.increase(315_360_001);

      const tx = await core.connect(patient).softDeleteRecord(1);
      await expect(tx).to.emit(core, "RecordDeleted").withArgs(1, patient.address);
    });

    it("should block deletion within retention period", async function () {
      await core.connect(doctor).addRecord(patient.address, 0, SAMPLE_CID, SAMPLE_HASH);

      await expect(
        core.connect(patient).softDeleteRecord(1)
      ).to.be.revertedWith("Record within minimum retention period");
    });

    it("should prevent non-patient from deleting", async function () {
      await core.connect(doctor).addRecord(patient.address, 0, SAMPLE_CID, SAMPLE_HASH);
      await time.increase(315_360_001);

      await expect(
        core.connect(doctor).softDeleteRecord(1)
      ).to.be.revertedWith("Not the patient");
    });

    it("should prevent accessing deleted records", async function () {
      await core.connect(doctor).addRecord(patient.address, 0, SAMPLE_CID, SAMPLE_HASH);
      await time.increase(315_360_001);
      await core.connect(patient).softDeleteRecord(1);

      await expect(
        core.connect(patient).getRecord(1)
      ).to.be.revertedWith("Record is deleted");
    });

    it("should prevent double deletion", async function () {
      await core.connect(doctor).addRecord(patient.address, 0, SAMPLE_CID, SAMPLE_HASH);
      await time.increase(315_360_001);
      await core.connect(patient).softDeleteRecord(1);

      await expect(
        core.connect(patient).softDeleteRecord(1)
      ).to.be.revertedWith("Record is deleted");
    });
  });

  // ═══════════════════════════════════════════
  //  ACCESS CONTROL
  // ═══════════════════════════════════════════

  describe("Access Control", function () {
    beforeEach(async function () {
      await core.connect(doctor).addRecord(patient.address, 0, SAMPLE_CID, SAMPLE_HASH);
    });

    it("should allow patient to grant time-limited access", async function () {
      const tx = await core.connect(patient).grantAccess(
        patient2.address,
        1,
        3, // Specialist
        THIRTY_DAYS
      );

      await expect(tx).to.emit(core, "AccessGranted");

      // Grantee should now be able to read
      const record = await core.connect(patient2).getRecord.staticCall(1);
      expect(record.ipfsCID).to.equal(SAMPLE_CID);
    });

    it("should allow blanket access (recordId = 0)", async function () {
      await core.connect(patient).grantAccess(patient2.address, 0, 3, THIRTY_DAYS);

      // Add another record
      await core.connect(doctor).addRecord(patient.address, 1, "QmLabCID", SAMPLE_HASH);

      // Grantee should access both records
      const record1 = await core.connect(patient2).getRecord.staticCall(1);
      const record2 = await core.connect(patient2).getRecord.staticCall(2);
      expect(record1.id).to.equal(1);
      expect(record2.id).to.equal(2);
    });

    it("should deny access to unauthorized users", async function () {
      await expect(
        core.connect(stranger).getRecord(1)
      ).to.be.revertedWith("Not authorized to access this record");
    });

    it("should emit FailedAccessAttempt on unauthorized read", async function () {
      // Events from reverted transactions don't persist on-chain.
      // Verify the revert happens correctly:
      await expect(
        core.connect(stranger).getRecord(1)
      ).to.be.revertedWith("Not authorized to access this record");

      // Verify checkAccess returns the denial reason (view function):
      const [hasAccess, reason] = await core.connect(stranger).checkAccess(1);
      expect(hasAccess).to.be.false;
      expect(reason).to.equal("No valid access grant");
    });

    it("should deny access after revocation", async function () {
      await core.connect(patient).grantAccess(patient2.address, 1, 3, THIRTY_DAYS);

      // Verify access works
      await core.connect(patient2).getRecord(1);

      // Revoke
      await core.connect(patient).revokeAccess(patient2.address, 1);

      // Should now fail
      await expect(
        core.connect(patient2).getRecord(1)
      ).to.be.revertedWith("Not authorized to access this record");
    });

    it("should deny access after expiration", async function () {
      await core.connect(patient).grantAccess(patient2.address, 1, 3, 60); // 60 seconds

      // Verify access works now
      await core.connect(patient2).getRecord(1);

      // Fast-forward past expiration
      await time.increase(61);

      await expect(
        core.connect(patient2).getRecord(1)
      ).to.be.revertedWith("Not authorized to access this record");
    });

    it("should enforce grant rate limiting", async function () {
      await core.connect(patient).grantAccess(patient2.address, 1, 3, THIRTY_DAYS);

      // Second grant within 60 seconds should fail
      await expect(
        core.connect(patient).grantAccess(doctor2.address, 1, 2, THIRTY_DAYS)
      ).to.be.revertedWith("Grant cooldown: wait 60 seconds");
    });

    it("should allow grant after cooldown expires", async function () {
      await core.connect(patient).grantAccess(patient2.address, 1, 3, THIRTY_DAYS);

      await time.increase(61);

      // Should work now
      await core.connect(patient).grantAccess(doctor2.address, 1, 2, THIRTY_DAYS);
    });

    it("should reject grant duration over 1 year", async function () {
      await expect(
        core.connect(patient).grantAccess(patient2.address, 1, 3, ONE_YEAR + 1)
      ).to.be.revertedWith("Max 1 year grant");
    });

    it("should reject self-grant", async function () {
      await expect(
        core.connect(patient).grantAccess(patient.address, 1, 1, THIRTY_DAYS)
      ).to.be.revertedWith("Cannot grant to self");
    });

    it("should allow checkAccess view function", async function () {
      const [hasAccess, reason] = await core.connect(stranger).checkAccess(1);
      expect(hasAccess).to.be.false;
      expect(reason).to.equal("No valid access grant");

      const [hasAccess2] = await core.connect(patient).checkAccess(1);
      expect(hasAccess2).to.be.true;
    });
  });

  // ═══════════════════════════════════════════
  //  EMERGENCY ACCESS
  // ═══════════════════════════════════════════

  describe("Emergency Access", function () {
    beforeEach(async function () {
      await core.connect(doctor).addRecord(patient.address, 0, SAMPLE_CID, SAMPLE_HASH);
    });

    it("should allow doctor to use emergency access", async function () {
      const tx = await core.connect(doctor2).emergencyAccess(patient.address);

      await expect(tx)
        .to.emit(core, "EmergencyAccess")
        .withArgs(doctor2.address, patient.address, await time.latest());

      // Should now have access to the record
      const record = await core.connect(doctor2).getRecord.staticCall(1);
      expect(record.ipfsCID).to.equal(SAMPLE_CID);
    });

    it("should allow nurse to use emergency access", async function () {
      await core.connect(nurse).emergencyAccess(patient.address);
      const record = await core.connect(nurse).getRecord.staticCall(1);
      expect(record.id).to.equal(1);
    });

    it("should auto-expire emergency access after 24 hours", async function () {
      await core.connect(doctor2).emergencyAccess(patient.address);

      // Fast-forward 25 hours
      await time.increase(25 * 60 * 60);

      await expect(
        core.connect(doctor2).getRecord(1)
      ).to.be.revertedWith("Not authorized to access this record");
    });

    it("should reject emergency access from non-clinical staff", async function () {
      await expect(
        core.connect(stranger).emergencyAccess(patient.address)
      ).to.be.revertedWith("Only clinical staff for emergency access");
    });

    it("should log emergency access in audit trail", async function () {
      await core.connect(doctor2).emergencyAccess(patient.address);

      const auditSize = await core.getAuditLogSize();
      expect(auditSize).to.be.greaterThan(0);
    });
  });

  // ═══════════════════════════════════════════
  //  PRESCRIPTIONS
  // ═══════════════════════════════════════════

  describe("Prescriptions", function () {
    it("should allow doctor to write prescription", async function () {
      const tx = await core.connect(doctor).writePrescription(
        patient.address,
        "QmRxEncryptedCID",
        3, // refills
        30 // valid for 30 days
      );

      await expect(tx)
        .to.emit(core, "PrescriptionWritten")
        .withArgs(1, patient.address, doctor.address);

      const rx = await core.getPrescription(1);
      expect(rx.refillsRemaining).to.equal(3);
      expect(rx.status).to.equal(0); // Active
      expect(rx.prescriber).to.equal(doctor.address);
    });

    it("should reject prescription from non-doctor", async function () {
      await expect(
        core.connect(nurse).writePrescription(patient.address, "QmCID", 1, 30)
      ).to.be.revertedWith("Only doctors can prescribe");
    });

    it("should allow pharmacist to dispense", async function () {
      await core.connect(doctor).writePrescription(patient.address, "QmRxCID", 1, 30);

      const tx = await core.connect(pharmacist).dispensePrescription(1);
      await expect(tx).to.emit(core, "PrescriptionDispensed");

      const rx = await core.getPrescription(1);
      expect(rx.dispensedBy).to.equal(pharmacist.address);
      expect(rx.refillsRemaining).to.equal(0);
      expect(rx.status).to.equal(2); // AwaitingRefill
    });

    it("should handle refill countdown correctly", async function () {
      await core.connect(doctor).writePrescription(patient.address, "QmRxCID", 2, 30);

      // First dispense: 2 -> 1 refill
      await core.connect(pharmacist).dispensePrescription(1);
      let rx = await core.getPrescription(1);
      expect(rx.refillsRemaining).to.equal(1);
      expect(rx.status).to.equal(2); // AwaitingRefill

      // Second dispense: 1 -> 0 refills
      await core.connect(pharmacist).dispensePrescription(1);
      rx = await core.getPrescription(1);
      expect(rx.refillsRemaining).to.equal(0);
      expect(rx.status).to.equal(2); // AwaitingRefill

      // Third dispense: 0 refills -> Dispensed (final)
      await core.connect(pharmacist).dispensePrescription(1);
      rx = await core.getPrescription(1);
      expect(rx.status).to.equal(1); // Dispensed
    });

    it("should prevent double-dispensing after final dispense", async function () {
      await core.connect(doctor).writePrescription(patient.address, "QmRxCID", 0, 30);

      await core.connect(pharmacist).dispensePrescription(1);

      await expect(
        core.connect(pharmacist).dispensePrescription(1)
      ).to.be.revertedWith("Cannot dispense: invalid status");
    });

    it("should reject dispensing expired prescription", async function () {
      await core.connect(doctor).writePrescription(patient.address, "QmRxCID", 0, 1); // 1 day

      await time.increase(2 * 24 * 60 * 60); // 2 days

      await expect(
        core.connect(pharmacist).dispensePrescription(1)
      ).to.be.revertedWith("Prescription expired");
    });

    it("should reject dispensing by non-pharmacist", async function () {
      await core.connect(doctor).writePrescription(patient.address, "QmRxCID", 0, 30);

      await expect(
        core.connect(doctor).dispensePrescription(1)
      ).to.be.revertedWith("Only pharmacists");
    });

    it("should return paginated prescription IDs", async function () {
      for (let i = 0; i < 3; i++) {
        await core.connect(doctor).writePrescription(patient.address, `QmRx${i}`, 0, 30);
      }

      const [ids, total] = await core.getPatientPrescriptionIds(patient.address, 0, 10);
      expect(total).to.equal(3);
      expect(ids.length).to.equal(3);
    });
  });

  // ═══════════════════════════════════════════
  //  AUDIT TRAIL
  // ═══════════════════════════════════════════

  describe("Audit Trail", function () {
    it("should log record creation", async function () {
      await core.connect(doctor).addRecord(patient.address, 0, SAMPLE_CID, SAMPLE_HASH);

      const trail = await core.getAuditTrail(1);
      expect(trail.length).to.equal(1);
      expect(trail[0].action).to.equal("CREATE");
      expect(trail[0].accessor).to.equal(doctor.address);
      expect(trail[0].isEmergency).to.be.false;
    });

    it("should log record reads", async function () {
      await core.connect(doctor).addRecord(patient.address, 0, SAMPLE_CID, SAMPLE_HASH);
      await core.connect(patient).getRecord(1);

      const trail = await core.getAuditTrail(1);
      expect(trail.length).to.equal(2);
      expect(trail[0].action).to.equal("CREATE");
      expect(trail[1].action).to.equal("READ");
      expect(trail[1].accessor).to.equal(patient.address);
    });

    it("should log access grants and revocations", async function () {
      await core.connect(doctor).addRecord(patient.address, 0, SAMPLE_CID, SAMPLE_HASH);
      await core.connect(patient).grantAccess(patient2.address, 1, 3, THIRTY_DAYS);

      const trail = await core.getAuditTrail(1);
      const grantEntry = trail.find(e => e.action === "GRANT");
      expect(grantEntry).to.not.be.undefined;
      expect(grantEntry.accessor).to.equal(patient.address);
    });

    it("should mark emergency access in audit trail", async function () {
      await core.connect(doctor).addRecord(patient.address, 0, SAMPLE_CID, SAMPLE_HASH);
      await core.connect(doctor2).emergencyAccess(patient.address);

      const logSize = await core.getAuditLogSize();
      expect(logSize).to.be.greaterThan(0);
    });
  });

  // ═══════════════════════════════════════════
  //  DEATH PROTOCOL
  // ═══════════════════════════════════════════

  describe("Death Protocol", function () {
    beforeEach(async function () {
      await core.connect(doctor).addRecord(patient.address, 0, SAMPLE_CID, SAMPLE_HASH);
    });

    it("should allow admin to declare patient deceased", async function () {
      const tx = await core.declareDeceased(patient.address, executor.address);

      await expect(tx)
        .to.emit(core, "PatientDeceased")
        .withArgs(patient.address, executor.address, await time.latest());

      expect(await core.isDeceased(patient.address)).to.be.true;
      expect(await core.recordExecutor(patient.address)).to.equal(executor.address);
    });

    it("should give executor access to deceased patient records", async function () {
      await core.declareDeceased(patient.address, executor.address);

      const record = await core.connect(executor).getRecord.staticCall(1);
      expect(record.id).to.equal(1);
    });

    it("should revoke all other access after death", async function () {
      // Grant access to doctor2 before death
      await core.connect(patient).grantAccess(doctor2.address, 1, 2, THIRTY_DAYS);
      await core.connect(doctor2).getRecord(1); // Should work

      // Declare deceased
      await core.declareDeceased(patient.address, executor.address);

      // Doctor2's access should be revoked
      await expect(
        core.connect(doctor2).getRecord(1)
      ).to.be.revertedWith("Not authorized to access this record");
    });

    it("should prevent adding records for deceased patients", async function () {
      await core.declareDeceased(patient.address, executor.address);

      await expect(
        core.connect(doctor).addRecord(patient.address, 0, SAMPLE_CID, SAMPLE_HASH)
      ).to.be.revertedWith("Patient is deceased");
    });

    it("should prevent granting access for deceased patients", async function () {
      await core.declareDeceased(patient.address, executor.address);

      await expect(
        core.connect(patient).grantAccess(doctor2.address, 1, 2, THIRTY_DAYS)
      ).to.be.revertedWith("Patient is deceased");
    });

    it("should reject non-admin declaring death", async function () {
      await expect(
        core.connect(doctor).declareDeceased(patient.address, executor.address)
      ).to.be.reverted; // AccessControl revert
    });

    it("should reject double death declaration", async function () {
      await core.declareDeceased(patient.address, executor.address);

      await expect(
        core.declareDeceased(patient.address, executor.address)
      ).to.be.revertedWith("Already declared deceased");
    });
  });

  // ═══════════════════════════════════════════
  //  ADMIN FUNCTIONS
  // ═══════════════════════════════════════════

  describe("Admin Functions", function () {
    it("should allow admin to pause and unpause", async function () {
      await core.pause();

      await expect(
        core.connect(doctor).addRecord(patient.address, 0, SAMPLE_CID, SAMPLE_HASH)
      ).to.be.reverted; // EnforcedPause

      await core.unpause();

      // Should work again
      await core.connect(doctor).addRecord(patient.address, 0, SAMPLE_CID, SAMPLE_HASH);
    });

    it("should reject non-admin from pausing", async function () {
      await expect(core.connect(doctor).pause()).to.be.reverted;
    });

    it("should reject registering zero address", async function () {
      await expect(
        core.registerDoctor(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid address");
    });

    it("should allow admin to update retention policy", async function () {
      await core.setRetentionPolicy(0, 500_000_000); // ~15.8 years for ClinicalEncounter
      expect(await core.minRetention(0)).to.equal(500_000_000);
    });
  });

  // ═══════════════════════════════════════════
  //  GAS REPORTING
  // ═══════════════════════════════════════════

  describe("Gas Benchmarks", function () {
    it("addRecord gas cost", async function () {
      const tx = await core.connect(doctor).addRecord(
        patient.address, 0, SAMPLE_CID, SAMPLE_HASH
      );
      const receipt = await tx.wait();
      console.log(`    addRecord gas: ${receipt.gasUsed.toString()}`);
    });

    it("getRecord gas cost", async function () {
      await core.connect(doctor).addRecord(patient.address, 0, SAMPLE_CID, SAMPLE_HASH);
      const tx = await core.connect(patient).getRecord(1);
      // Note: getRecord is state-changing (audit log), so it uses gas
    });

    it("grantAccess gas cost", async function () {
      await core.connect(doctor).addRecord(patient.address, 0, SAMPLE_CID, SAMPLE_HASH);
      const tx = await core.connect(patient).grantAccess(
        patient2.address, 1, 3, THIRTY_DAYS
      );
      const receipt = await tx.wait();
      console.log(`    grantAccess gas: ${receipt.gasUsed.toString()}`);
    });

    it("writePrescription gas cost", async function () {
      const tx = await core.connect(doctor).writePrescription(
        patient.address, "QmRxCID", 3, 30
      );
      const receipt = await tx.wait();
      console.log(`    writePrescription gas: ${receipt.gasUsed.toString()}`);
    });

    it("dispensePrescription gas cost", async function () {
      await core.connect(doctor).writePrescription(patient.address, "QmRxCID", 1, 30);
      const tx = await core.connect(pharmacist).dispensePrescription(1);
      const receipt = await tx.wait();
      console.log(`    dispensePrescription gas: ${receipt.gasUsed.toString()}`);
    });
  });
});