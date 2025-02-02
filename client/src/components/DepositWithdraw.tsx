import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { useToast } from '@/hooks/use-toast';
import { ethers } from 'ethers';
import { useWeb3, useUSDCBalance, useStrategyContract } from '@/lib/web3/hooks';
import { CONTRACT_METADATA } from '@/lib/web3/constants';

export function DepositWithdraw() {
  const { provider, account, error, connectWallet } = useWeb3();
  const { balance, loading: balanceLoading } = useUSDCBalance(account, provider);
  const { approveAndDeposit, requestWithdrawal } = useStrategyContract(account, provider);
  const [amount, setAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(true);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const handleAction = async () => {
    if (!amount || Number(amount) <= 0) {
      toast({ title: 'Please enter a valid amount', variant: 'destructive' });
      return;
    }

    if (Number(amount) > Number(balance) && isDepositing) {
      toast({ title: 'Insufficient USDC balance', variant: 'destructive' });
      return;
    }

    try {
      setProcessing(true);
      if (isDepositing) {
        await approveAndDeposit(amount);
        toast({ title: 'Deposit successful!' });
      } else {
        await requestWithdrawal(amount);
        toast({ title: 'Withdrawal request submitted!' });
      }
      setAmount('');
    } catch (err) {
      toast({
        title: 'Transaction failed',
        description: err instanceof Error ? err.message : 'Unknown error occurred',
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  if (!account) {
    return (
      <div className="space-y-4 p-4">
        <Button onClick={connectWallet} disabled={processing}>
          Connect Wallet
        </Button>
        {error && <p className="text-red-500">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex gap-2">
        <Button
          variant={isDepositing ? 'default' : 'outline'}
          onClick={() => setIsDepositing(true)}
        >
          Deposit
        </Button>
        <Button
          variant={!isDepositing ? 'default' : 'outline'}
          onClick={() => setIsDepositing(false)}
        >
          Withdraw
        </Button>
      </div>

      <Card className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">
            {isDepositing ? 'Deposit USDC' : 'Withdraw USDC'}
          </h3>
          <p className="text-sm text-gray-500">
            Balance: {balanceLoading ? '...' : `${Number(balance).toFixed(2)} USDC`}
          </p>
        </div>

        <div className="space-y-2">
          <Input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            max={isDepositing ? balance : undefined}
          />
          <Button
            onClick={handleAction}
            disabled={processing || !amount || Number(amount) <= 0}
            className="w-full"
          >
            {processing ? 'Processing...' : isDepositing ? 'Deposit' : 'Request Withdrawal'}
          </Button>
        </div>
      </Card>

      {/* Contract Info */}
      {Object.entries(CONTRACT_METADATA).map(([key, meta]) => (
        <Card key={key} className="p-4 space-y-2">
          <h4 className="font-medium">{meta.name}</h4>
          <div className="text-sm space-y-1">
            <p>Pair: {meta.pair}</p>
            <p>Pool Service: {meta.poolService}</p>
            <p>Address: {meta.address}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
