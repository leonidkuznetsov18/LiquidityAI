import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { connectWallet, disconnectWallet, getEtherscanLink } from "@/lib/web3";
import { Loader2, ExternalLink, Power } from "lucide-react";
import { formatEther } from "ethers";

interface Pool {
  id: string;
  token0: string;
  token1: string;
  feeTier: number;
  liquidity: string;
  token0Price: string;
  token1Price: string;
  address?: string;
  token0Amount?: string;
  token1Amount?: string;
}

export default function UniswapPools() {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [pools, setPools] = useState<Pool[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if already connected
    if (window.ethereum && window.ethereum.selectedAddress) {
      setAddress(window.ethereum.selectedAddress);
      setIsConnected(true);
      fetchPools();
    }

    // Listen for account changes
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        handleDisconnect();
      } else {
        setAddress(accounts[0]);
        setIsConnected(true);
        fetchPools();
      }
    };

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  const handleConnect = async () => {
    try {
      const account = await connectWallet();
      if (account) {
        setAddress(account);
        setIsConnected(true);
        await fetchPools();
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      toast({
        title: "Connection Failed",
        description: "Could not connect to your wallet",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = async () => {
    await disconnectWallet();
    setIsConnected(false);
    setAddress(null);
    setPools([]);
  };

  const fetchPools = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/uniswap/pools');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setPools(data.pools);
    } catch (error) {
      console.error('Failed to fetch pools:', error);
      toast({
        title: "Error",
        description: "Failed to fetch liquidity pools",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    if (isConnected) {
      fetchPools();
    }
  };

  const formatLiquidity = (amount: string, decimals: number = 18) => {
    try {
      const formatted = formatEther(amount);
      return parseFloat(formatted).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    } catch (error) {
      return "0.00";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Uniswap V3 Pools</h2>
        <div className="flex gap-2">
          {isConnected && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Refresh"
              )}
            </Button>
          )}
          <Button
            onClick={isConnected ? handleDisconnect : handleConnect}
            variant={isConnected ? "outline" : "default"}
            className="flex items-center gap-2"
          >
            {isConnected ? (
              <>
                <span>{`${address?.slice(0, 6)}...${address?.slice(-4)}`}</span>
                <Power className="h-4 w-4" />
              </>
            ) : (
              "Connect Wallet"
            )}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : pools.length > 0 ? (
        <div className="grid gap-4">
          {pools.map((pool) => (
            <Card key={pool.id} className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">
                    {pool.token0}/{pool.token1}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Fee Tier: {pool.feeTier / 10000}%
                  </p>
                </div>
                <div className="text-right">
                  <div className="space-y-1">
                    <p className="font-mono text-sm">
                      {pool.token0}: {formatLiquidity(pool.token0Amount || '0')}
                    </p>
                    <p className="font-mono text-sm">
                      {pool.token1}: {formatLiquidity(pool.token1Amount || '0', 6)} {/* USDC has 6 decimals */}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-muted-foreground">View on:</span>
                    <a
                      href={`https://info.uniswap.org/#/pools/${pool.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      Uniswap <ExternalLink className="h-3 w-3" />
                    </a>
                    <span className="text-muted-foreground">|</span>
                    <a
                      href={getEtherscanLink(pool.address || '', 'pool')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      Etherscan <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-6 text-center">
          {isConnected ? (
            <>
              <p className="text-muted-foreground">No pools found</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="mt-4"
              >
                Try Again
              </Button>
            </>
          ) : (
            <p className="text-muted-foreground">
              Connect your wallet to view Uniswap V3 pools
            </p>
          )}
        </Card>
      )}
    </div>
  );
}