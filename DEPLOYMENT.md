# Food Supply Chain Traceability System - Deployment Guide

## Overview
A decentralized food supply chain tracing system with blockchain integration and role-based access control.

## System Architecture

### Frontend (React + TypeScript)
- Landing page with product features
- Authentication system (Supabase Auth)
- Role-based dashboards (Collector, Tester, Processing, Manufacturing)
- Product management and traceability tracking

### Backend (Supabase)
- PostgreSQL database with Row Level Security
- Authentication and user management
- Real-time data synchronization

### Blockchain (Hardhat + Solidity)
- Smart contract for immutable product tracking
- Four-phase supply chain workflow
- Ethereum-based traceability records

## Prerequisites

1. Node.js (v18 or higher)
2. npm or yarn package manager
3. Supabase account (already configured)
4. MetaMask or web3 wallet (for blockchain features)
5. Hardhat (for blockchain deployment)

## Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Install Hardhat Dependencies

Due to network connectivity issues during initial setup, you'll need to install Hardhat dependencies:

```bash
npm install --save-dev hardhat@^2.26.3 @nomicfoundation/hardhat-toolbox@^6.1.0 ethers@^6.0.0
```

### 3. Environment Variables

Your `.env` file should already contain:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

## Blockchain Deployment

### 1. Start Local Hardhat Network

```bash
npx hardhat node
```

This starts a local Ethereum network on `http://127.0.0.1:8545`

### 2. Deploy Smart Contract

In a new terminal:

```bash
npx hardhat run scripts/deploy.js --network localhost
```

The contract address will be saved to `src/contracts/contract-address.json`

### 3. Configure MetaMask

1. Add the local Hardhat network to MetaMask:
   - Network Name: Hardhat Local
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 1337
   - Currency Symbol: ETH

2. Import test accounts from Hardhat (check console output for private keys)

## Database Setup

The database schema is already applied via Supabase migrations. It includes:

- **profiles**: User profiles with roles
- **products**: Product tracking
- **phase_records**: Phase transition history
- **documents**: Document metadata

### Default User Roles

- `collector`: Can create and register products
- `tester`: Can test and certify products
- `processing`: Can process certified products
- `manufacturing`: Can manufacture processed products
- `admin`: Full access to all features

## Application Features

### Landing Page
- Product overview and feature highlights
- Call-to-action for user registration
- Information about blockchain-powered traceability

### Authentication
- Email/password sign up and sign in
- Automatic profile creation on registration
- Protected routes requiring authentication

### Dashboard
- Role-specific statistics and metrics
- Recent products overview
- Quick access to main features

### Products Page
- Create new products (Collectors only)
- View products in current user's phase
- Process products (approve/reject)
- Search and filter functionality

### Traceability Page
- Search products by batch number
- View complete supply chain history
- See all phase records and handlers
- Display test results and notes

## Role-Based Workflow

1. **Collector Phase**
   - Create product with batch number
   - Add collection notes and data
   - Submit for testing

2. **Tester Phase**
   - Review collected products
   - Perform quality tests
   - Approve or reject with test results

3. **Processing Phase**
   - Process approved products
   - Document processing steps
   - Approve or reject for manufacturing

4. **Manufacturing Phase**
   - Manufacture processed products
   - Final quality check
   - Complete or reject product

## Blockchain Integration

The blockchain service provides:
- Immutable product creation records
- Phase transition tracking
- Complete traceability via smart contract
- Decentralized data verification

### Key Functions

- `createProductOnChain()`: Register new product on blockchain
- `updatePhaseOnChain()`: Record phase transitions
- `getFullTraceability()`: Retrieve complete product history
- `connectWallet()`: Connect user's Web3 wallet

## Running the Application

### Development Mode

```bash
npm run dev
```

Access at: `http://localhost:5173`

### Production Build

```bash
npm run build
npm run preview
```

## Testing Smart Contracts

Create test files in the `test/` directory:

```bash
npx hardhat test
```

## Security Features

### Row Level Security (RLS)
- Users can only access data relevant to their role
- Phase-based access control
- Admin override capabilities

### Blockchain Security
- Immutable records
- Role-based contract permissions
- Cryptographic verification

## Troubleshooting

### Hardhat Installation Issues
If you encounter network errors during installation, retry or use:
```bash
npm install --save-dev hardhat --legacy-peer-deps
```

### Database Connection
Ensure Supabase environment variables are correctly set in `.env`

### MetaMask Connection
1. Ensure MetaMask is installed
2. Connect to the correct network (Hardhat Local for development)
3. Ensure you have test ETH in your wallet

## Production Deployment

### Frontend
Deploy to Vercel, Netlify, or similar:
```bash
npm run build
# Upload dist/ folder
```

### Blockchain
For mainnet or testnet deployment:
1. Update `hardhat.config.js` with network details
2. Add private key to environment
3. Deploy: `npx hardhat run scripts/deploy.js --network <network-name>`

### Database
Supabase automatically handles production database deployment

## Support

For issues or questions:
- Check Hardhat documentation: https://hardhat.org/docs
- Supabase documentation: https://supabase.com/docs
- Ethereum/Ethers documentation: https://docs.ethers.org
