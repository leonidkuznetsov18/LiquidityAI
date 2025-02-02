import { useCallback, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { CONTRACTS, BSC_CHAIN_ID } from './constants';

export function useWeb3() {
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connectWallet = useCallback(async () => {
    try {
      if (!window.ethereum) {
        throw new Error('Please install MetaMask');
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const [account] = await provider.send('eth_requestAccounts', []);
      const { chainId } = await provider.getNetwork();

      if (chainId !== BSC_CHAIN_ID) {
        throw new Error('Please connect to BSC network');
      }

      setProvider(provider);
      setAccount(account);
      setChainId(chainId);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
      console.error('Wallet connection error:', err);
    }
  }, []);

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', ([newAccount]: string[]) => {
        setAccount(newAccount || null);
      });

      window.ethereum.on('chainChanged', (chainId: string) => {
        setChainId(parseInt(chainId, 16));
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners();
      }
    };
  }, []);

  return { provider, account, chainId, error, connectWallet };
}

export function useUSDCBalance(account: string | null, provider: ethers.providers.Web3Provider | null) {
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!account || !provider) return;

      try {
        setLoading(true);
        const contract = new ethers.Contract(
          CONTRACTS.USDC.address,
          CONTRACTS.USDC.abi,
          provider
        );

        const decimals = await contract.decimals();
        const rawBalance = await contract.balanceOf(account);
        setBalance(ethers.utils.formatUnits(rawBalance, decimals));
      } catch (err) {
        console.error('Failed to fetch USDC balance:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, [account, provider]);

  return { balance, loading };
}

export function useStrategyContract(
  account: string | null,
  provider: ethers.providers.Web3Provider | null
) {
  const approveAndDeposit = useCallback(
    async (amount: string) => {
      if (!account || !provider) throw new Error('Wallet not connected');

      const signer = provider.getSigner();
      const usdc = new ethers.Contract(
        CONTRACTS.USDC.address,
        CONTRACTS.USDC.abi,
        signer
      );
      const strategy = new ethers.Contract(
        CONTRACTS.STRATEGY.address,
        CONTRACTS.STRATEGY.abi,
        signer
      );

      // Get USDC decimals
      const decimals = await usdc.decimals();
      const parsedAmount = ethers.utils.parseUnits(amount, decimals);

      // Approve USDC spending
      const approvalTx = await usdc.approve(
        CONTRACTS.STRATEGY.address,
        ethers.constants.MaxUint256
      );
      await approvalTx.wait();

      // Deposit into strategy
      const depositTx = await strategy.deposit(parsedAmount);
      await depositTx.wait();
    },
    [account, provider]
  );

  const requestWithdrawal = useCallback(
    async (amount: string) => {
      if (!account || !provider) throw new Error('Wallet not connected');

      const signer = provider.getSigner();
      const strategy = new ethers.Contract(
        CONTRACTS.STRATEGY.address,
        CONTRACTS.STRATEGY.abi,
        signer
      );

      const decimals = await new ethers.Contract(
        CONTRACTS.USDC.address,
        CONTRACTS.USDC.abi,
        provider
      ).decimals();
      const parsedAmount = ethers.utils.parseUnits(amount, decimals);

      const tx = await strategy.requestWithdrawal(parsedAmount);
      await tx.wait();
    },
    [account, provider]
  );

  return { approveAndDeposit, requestWithdrawal };
}
