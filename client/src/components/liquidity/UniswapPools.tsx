import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { connectWallet } from "@/lib/web3";
import { Loader2 } from "lucide-react";
import { formatEther, parseEther } from "ethers";

interface Pool {
  id: string;
  token0: string;
  token1: string;
  feeTier: number;
  liquidity: string;
  token0Price: string;
  token1Price: string;
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
    }
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

  const fetchPools = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/uniswap/pools');
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Uniswap V3 Pools</h2>
        <Button
          onClick={handleConnect}
          variant={isConnected ? "outline" : "default"}
        >
          {isConnected ? 
            `Connected: ${address?.slice(0, 6)}...${address?.slice(-4)}` : 
            "Connect Wallet"
          }
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
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
                  <p className="font-mono">
                    1 {pool.token0} = {parseFloat(pool.token0Price).toFixed(6)} {pool.token1}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Liquidity: ${formatEther(pool.liquidity)}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
