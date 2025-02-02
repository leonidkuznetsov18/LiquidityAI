import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useUSDCBalance, useStrategyContract, useContractBalances } from '@/lib/web3/hooks';
import { CONTRACT_METADATA } from '@/lib/web3/constants';
import { useAccount } from '@/contexts/AccountContext';
import { getBscProvider } from '@/lib/web3/utils';

export function DepositWithdraw() {
  const { address } = useAccount();
  const { balance, loading: balanceLoading } = useUSDCBalance(address);
  const { userBalance, totalSupply, loading: contractLoading } = useContractBalances(address);
  const { approveAndDeposit, requestWithdrawal } = useStrategyContract(address);
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

    if (!isDepositing && Number(amount) > Number(userBalance)) {
      toast({ title: 'Insufficient contract balance', variant: 'destructive' });
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
      console.error(err);
      toast({
        title: 'Transaction failed',
        description: err instanceof Error ? err.message : 'Unknown error occurred',
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
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
          <div className="text-sm text-gray-500 space-y-1">
            <p>Wallet Balance: {balanceLoading ? '...' : `${Number(balance).toFixed(2)} USDC`}</p>
            <p>Contract Balance: {contractLoading ? '...' : `${Number(userBalance).toFixed(2)} USDC`}</p>
          </div>
        </div>

        <div className="space-y-2">
          <Input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            max={isDepositing ? balance : userBalance}
          />
          <Button
            onClick={handleAction}
            disabled={
              processing ||
              !amount ||
              Number(amount) <= 0 ||
              (isDepositing && Number(amount) > Number(balance)) ||
              (!isDepositing && Number(amount) > Number(userBalance))
            }
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
            <p>Pair: <span className={'font-bold font-mono'}>{meta.pair}</span></p>
            <p>Pool Service: <span className={'font-bold font-mono'}>{meta.poolService}</span></p>
            <p>Contract Address: <span className={'font-bold font-mono'}>{meta.address}</span></p>
            <p>Pool Address: <span className={'font-bold font-mono'}>{meta.poolAddress}</span></p>
            <p>Total Pool Balance: {contractLoading ? '...' : <span className={'font-bold font-mono'}>${Number(totalSupply).toFixed(2)} USDC</span>}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
