import { useCallback, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { CONTRACTS } from './constants';
import { 
  getBscProvider,
  getWalletProvider,
  getWalletSigner,
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
        const contract = await getUsdcContract();
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

export function useContractBalances(account: string | null) {
  const [userBalance, setUserBalance] = useState<string>('0');
  const [totalSupply, setTotalSupply] = useState<string>('0');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBalances = async () => {
      try {
        setLoading(true);
        const contract = await getStrategyContract();
        const usdcContract = await getUsdcContract();

        // Get total supply
        const rawTotalSupply = await contract.totalSupply();
        const formattedTotalSupply = await formatTokenAmount(rawTotalSupply, usdcContract);
        setTotalSupply(formattedTotalSupply);

        // Get user balance if account exists
        if (account) {
          const rawUserBalance = await contract.balanceOf(account);
          const formattedUserBalance = await formatTokenAmount(rawUserBalance, usdcContract);
          setUserBalance(formattedUserBalance);
        }
      } catch (err) {
        console.error('Failed to fetch contract balances:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBalances();
  }, [account]);

  return { userBalance, totalSupply, loading };
}

export function useStrategyContract(account: string | null) {
  const approveAndDeposit = useCallback(
    async (amount: string) => {
      if (!account) throw new Error('Wallet not connected');

      try {
        // Get signer from connected wallet
        const signer = await getWalletSigner();

        // Create contract instances with signer
        const usdcContract = await getUsdcContract(signer);
        const strategyContract = await getStrategyContract(signer);

        // Parse amount with proper decimals
        const parsedAmount = await parseTokenAmount(amount, usdcContract);

        // Approve USDC spending
        console.log('Approving USDC...');
        const approvalTx = await usdcContract.approve(
          CONTRACTS.STRATEGY.address,
          parsedAmount
        );
        console.log('Approval transaction:', approvalTx);
        await approvalTx.wait();
        console.log('Approval confirmed');

        // Deposit into strategy
        console.log('Depositing to strategy...');
        const depositTx = await strategyContract.deposit(parsedAmount);
        console.log('Deposit transaction:', depositTx);
        await depositTx.wait();
        console.log('Deposit confirmed');

      } catch (error) {
        console.error('Transaction failed:', error);
        throw error;
      }
    },
    [account]
  );

  const requestWithdrawal = useCallback(
    async (amount: string) => {
      if (!account) throw new Error('Wallet not connected');

      try {
        // Get signer from connected wallet
        const signer = await getWalletSigner();
        const usdcContract = await getUsdcContract(signer);
        const strategyContract = await getStrategyContract(signer);

        const parsedAmount = await parseTokenAmount(amount, usdcContract);

        console.log('Requesting withdrawal...');
        const tx = await strategyContract.requestWithdrawal(parsedAmount);
        console.log('Withdrawal request transaction:', tx);
        await tx.wait();
        console.log('Withdrawal request confirmed');

      } catch (error) {
        console.error('Withdrawal request failed:', error);
        throw error;
      }
    },
    [account]
  );

  return { approveAndDeposit, requestWithdrawal };
}