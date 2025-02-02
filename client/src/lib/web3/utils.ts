import { ethers, Contract } from 'ethers';
import { CONTRACTS } from './constants';

// BSC mainnet provider singleton - for read-only operations
export function getBscProvider() {
  return new ethers.JsonRpcProvider('https://rpc.ankr.com/bsc');
}

// Get wallet provider and signer
export async function getWalletProvider() {
  if (!window.ethereum) throw new Error('MetaMask not installed');
  return new ethers.BrowserProvider(window.ethereum);
}

export async function getWalletSigner() {
  const provider = await getWalletProvider();
  return provider.getSigner();
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
export async function getUsdcContract(signer?: ethers.Signer) {
  return createContract(
    CONTRACTS.USDC.address,
    CONTRACTS.USDC.abi,
    signer || getBscProvider()
  );
}

// Get strategy contract instance
export async function getStrategyContract(signer?: ethers.Signer) {
  return createContract(
    CONTRACTS.STRATEGY.address,
    CONTRACTS.STRATEGY.abi,
    signer || getBscProvider()
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