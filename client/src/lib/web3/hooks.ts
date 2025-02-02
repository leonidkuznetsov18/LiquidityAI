import { useCallback, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { CONTRACTS } from './constants';

export function useUSDCBalance(account: string | null) {
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!account) return;

      try {
        setLoading(true);
        // Use BSC mainnet provider
        const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
        const contract = new ethers.Contract(
          CONTRACTS.USDC.address,
          CONTRACTS.USDC.abi,
          provider
        );

        const decimals = await contract.decimals();
        const rawBalance = await contract.balanceOf(account);
        setBalance(ethers.formatUnits(rawBalance, decimals));
      } catch (err) {
        console.error('Failed to fetch USDC balance:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, [account]);

  return { balance, loading };
}

export function useStrategyContract(account: string | null) {
  const approveAndDeposit = useCallback(
    async (amount: string) => {
      if (!account) throw new Error('Wallet not connected');

      // Use BSC mainnet provider
      const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
      const signer = await provider.getSigner(account);

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
      const parsedAmount = ethers.parseUnits(amount, decimals);

      // Approve USDC spending
      const approvalTx = await usdc.approve(
        CONTRACTS.STRATEGY.address,
        ethers.MaxUint256 // Use MaxUint256 for high amount approval
      );
      await approvalTx.wait();

      // Deposit into strategy
      const depositTx = await strategy.deposit(parsedAmount);
      await depositTx.wait();
    },
    [account]
  );

  const requestWithdrawal = useCallback(
    async (amount: string) => {
      if (!account) throw new Error('Wallet not connected');

      const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
      const signer = await provider.getSigner(account);

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
      const parsedAmount = ethers.parseUnits(amount, decimals);

      const tx = await strategy.requestWithdrawal(parsedAmount);
      await tx.wait();
    },
    [account]
  );

  return { approveAndDeposit, requestWithdrawal };
}