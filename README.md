# MediChain v2.1 - Sprint 1: Smart Contracts

Decentralized Medical Records Management System on Polygon.

## Quick Start

```bash
# 1. Install dependencies
cd packages/contracts
npm install

# 2. Compile contracts
npx hardhat compile

# 3. Run all tests (55 tests)
npx hardhat test

# 4. Run tests with gas reporting
REPORT_GAS=true npx hardhat test #MAC
#WINDOWS

$env:REPORT_GAS="true"
npx hardhat test

# 5. Check test coverage
npx hardhat coverage

# 6. Deploy to local network
npx hardhat node                                    # Terminal 1
npx hardhat run scripts/deploy.js --network localhost  # Terminal 2

# 7. Deploy to Polygon Mumbai testnet
cp .env.example .env   # Fill in your PRIVATE_KEY
npx hardhat run scripts/deploy.js --network mumbai
```

## Project Structure

```
packages/contracts/
├── contracts/
│   ├── core/
│   │   └── MediChainCore.sol    # Main contract (records, access, Rx, audit)
│   └── libraries/
│       └── RecordTypes.sol      # Shared data structures & enums
├── scripts/
│   └── deploy.js                # Deployment script with verification
├── test/
│   └── MediChainCore.test.js    # 55 tests across 8 categories
├── hardhat.config.js            # Hardhat config (Polygon networks)
├── .env.example                 # Environment template
└── .gitignore
```

## What's Included (Sprint 1)

### Smart Contract Features
- **7 medical record types** (Clinical Encounter, Lab Result, Prescription, Imaging, Vital Signs, Immunization, Surgical History)
- **Role-based access control** (Doctor, Nurse, Pharmacist, Lab Tech, Admin)
- **Time-limited access grants** with 60-second rate limiting
- **Emergency break-glass** protocol (24-hour auto-expiry)
- **Prescription lifecycle** (write → dispense → refill → complete)
- **Immutable audit trail** for every action
- **Patient death protocol** with executor designation
- **Data retention policy** engine (10yr general, 30yr surgical)
- **Paginated queries** to prevent gas limit issues
- **Pausable** emergency stop mechanism
- **ReentrancyGuard** on all state-changing functions
- **Failed access attempt** event logging

### Test Coverage (55 tests)
- Record Management (10 tests)
- Soft Delete & Retention (5 tests)
- Access Control (11 tests)
- Emergency Access (5 tests)
- Prescriptions (8 tests)
- Audit Trail (4 tests)
- Death Protocol (7 tests)
- Admin Functions (4 tests)
- Gas Benchmarks (5 tests)

## Next Sprints
- **Sprint 2**: Frontend (React + TypeScript + Tailwind)
- **Sprint 3**: Encryption service (ECDH + HKDF + AES-256-GCM)
- **Sprint 4**: IPFS integration (Pinata) + offline-first PWA

## Author
Sam MUGABO | University of Rwanda | 2026
