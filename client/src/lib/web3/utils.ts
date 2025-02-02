import { ethers, Contract } from 'ethers';
import { CONTRACTS } from './constants';

// BSC mainnet provider singleton
export function getBscProvider() {
  return new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
}

// Get wallet provider and signer
export async function getWalletProvider() {
  if (!window.ethereum) throw new Error('MetaMask not installed');

  try {
    // Request account access
    await window.ethereum.request({ method: 'eth_requestAccounts' });

    // Create Web3Provider from MetaMask
    const provider = new ethers.BrowserProvider(window.ethereum);
    return provider;
  } catch (error) {
    if (error.code === 4001) {
      throw new Error('Please connect to MetaMask.');
    }
    throw error;
  }
}

export async function getWalletSigner() {
  const provider = await getWalletProvider();
  return await provider.getSigner();
}

// Contract factory function
export function createContract(
  address: string,
  abi: any[],
  signerOrProvider: ethers.Provider | ethers.Signer
): Contract {
  return new ethers.Contract(address, abi, signerOrProvider);
}

// Get USDC contract instance
export function getUsdcContract(signerOrProvider = getBscProvider()) {
  return createContract(
    CONTRACTS.USDC.address,
    CONTRACTS.USDC.abi,
    signerOrProvider
  );
}

// Get strategy contract instance
export function getStrategyContract(signerOrProvider = getBscProvider()) {
  return createContract(
    CONTRACTS.STRATEGY.address,
    CONTRACTS.STRATEGY.abi,
    signerOrProvider
  );
}

// Format units with proper decimals
export async function formatTokenAmount(
  amount: bigint,
  contract: Contract
): Promise<string> {
  const decimals = await contract.decimals();
  return ethers.formatUnits(amount, decimals);
}

// Parse units with proper decimals
export async function parseTokenAmount(
  amount: string,
  contract: Contract
): Promise<bigint> {
  const decimals = await contract.decimals();
  return ethers.parseUnits(amount, decimals);
}