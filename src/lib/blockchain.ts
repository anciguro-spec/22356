import { ethers } from 'ethers';

export interface BlockchainConfig {
  contractAddress: string;
  rpcUrl: string;
}

export class BlockchainService {
  private provider: ethers.BrowserProvider | null = null;
  private contract: ethers.Contract | null = null;
  private signer: ethers.Signer | null = null;

  async initialize(config: BlockchainConfig) {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask or web3 provider not found. Please install MetaMask.');
    }

    this.provider = new ethers.BrowserProvider(window.ethereum);
    this.signer = await this.provider.getSigner();
  }

  async connectWallet(): Promise<string> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    return accounts[0];
  }

  async getWalletAddress(): Promise<string | null> {
    if (!this.provider) return null;

    try {
      const signer = await this.provider.getSigner();
      return await signer.getAddress();
    } catch {
      return null;
    }
  }

  async createProductOnChain(
    name: string,
    batchNumber: string,
    notes: string,
    ipfsHash: string
  ): Promise<{ txHash: string; productId: number }> {
    if (!this.contract || !this.signer) {
      throw new Error('Contract not initialized');
    }

    const tx = await this.contract.createProduct(name, batchNumber, notes, ipfsHash);
    const receipt = await tx.wait();

    const event = receipt.logs.find((log: any) => log.fragment?.name === 'ProductCreated');
    const productId = event ? Number(event.args[0]) : 0;

    return {
      txHash: receipt.hash,
      productId,
    };
  }

  async updatePhaseOnChain(
    productId: number,
    status: 'approved' | 'rejected',
    notes: string,
    ipfsHash: string
  ): Promise<string> {
    if (!this.contract || !this.signer) {
      throw new Error('Contract not initialized');
    }

    const statusMap = { approved: 1, rejected: 2 };
    const tx = await this.contract.updatePhase(productId, statusMap[status], notes, ipfsHash);
    const receipt = await tx.wait();

    return receipt.hash;
  }

  async getProductFromChain(productId: number): Promise<any> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    const product = await this.contract.getProduct(productId);
    return {
      id: Number(product.id),
      name: product.name,
      batchNumber: product.batchNumber,
      collector: product.collector,
      collectionTimestamp: Number(product.collectionTimestamp),
      currentPhase: Number(product.currentPhase),
      status: Number(product.status),
    };
  }

  async getPhaseDataFromChain(productId: number, phase: number): Promise<any> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    const phaseData = await this.contract.getPhaseData(productId, phase);
    return {
      handler: phaseData.handler,
      timestamp: Number(phaseData.timestamp),
      status: Number(phaseData.status),
      notes: phaseData.notes,
      ipfsHash: phaseData.ipfsHash,
    };
  }

  async getFullTraceability(productId: number): Promise<any> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    const trace = await this.contract.getFullTraceability(productId);
    return {
      name: trace.name,
      batchNumber: trace.batchNumber,
      collector: trace.collectorData,
      tester: trace.testerData,
      processing: trace.processingData,
      manufacturing: trace.manufacturingData,
    };
  }
}

export const blockchainService = new BlockchainService();
