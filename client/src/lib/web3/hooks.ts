import { useCallback, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { CONTRACTS } from './constants';
import { 
  getBscProvider, 
  getUsdcContract, 
  getStrategyContract,
  formatTokenAmount,
  parseTokenAmount
} from './utils';

export function useUSDCBalance(account: string | null) {
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!account) return;

      try {
        setLoading(true);
        const contract = getUsdcContract();
        const rawBalance = await contract.balanceOf(account);
        const formatted = await formatTokenAmount(rawBalance, contract);
        setBalance(formatted);
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

      const provider = getBscProvider();
      const signer = await provider.getSigner(account);

      const usdcContract = getUsdcContract(signer);
      const strategyContract = getStrategyContract(signer);

      // Parse amount with proper decimals
      const parsedAmount = await parseTokenAmount(amount, usdcContract);

      // Approve USDC spending
      const approvalTx = await usdcContract.approve(
        CONTRACTS.STRATEGY.address,
        ethers.MaxUint256
      );
      await approvalTx.wait();

      // Deposit into strategy
      const depositTx = await strategyContract.deposit(parsedAmount);
      await depositTx.wait();
    },
    [account]
  );

  const requestWithdrawal = useCallback(
    async (amount: string) => {
      if (!account) throw new Error('Wallet not connected');

      const provider = getBscProvider();
      const signer = await provider.getSigner(account);
      const usdcContract = getUsdcContract(provider);
      const strategyContract = getStrategyContract(signer);

      const parsedAmount = await parseTokenAmount(amount, usdcContract);

      const tx = await strategyContract.requestWithdrawal(parsedAmount);
      await tx.wait();
    },
    [account]
  );

  return { approveAndDeposit, requestWithdrawal };
}