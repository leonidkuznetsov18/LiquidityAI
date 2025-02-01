import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { connectWallet, disconnectWallet, getEtherscanLink } from "@/lib/web3";
import { Loader2, ExternalLink, Power } from "lucide-react";
import { formatEther } from "ethers";
import { usePools } from "@/hooks/usePools";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Platform = 'all' | 'uniswap' | 'pancakeswap';

export default function UniswapPools() {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('all');
  const { data: pools, isLoading, refetch } = usePools();
  const { toast } = useToast();

  const handleConnect = async () => {
    try {
      const account = await connectWallet();
      if (account) {
        setAddress(account);
        setIsConnected(true);
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
  };

  const formatLiquidity = (amount: string) => {
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

  const getExplorerLink = (poolAddress: string, platform: string) => {
    if (platform === 'pancakeswap') {
      return `https://bscscan.com/address/${poolAddress}`;
    }
    return getEtherscanLink(poolAddress, 'pool');
  };

  const getPlatformExplorerName = (platform: string) => {
    return platform === 'pancakeswap' ? 'BSCScan' : 'Etherscan';
  };

  const getPlatformUrl = (poolAddress: string, platform: string) => {
    if (platform === 'pancakeswap') {
      return `https://pancakeswap.finance/info/v3/pools/${poolAddress}`;
    }
    return `https://info.uniswap.org/#/pools/${poolAddress}`;
  };

  const filteredPools = pools?.filter(pool => 
    selectedPlatform === 'all' ? true : pool.platform === selectedPlatform
  ) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Liquidity Pools</h2>
        <div className="flex gap-2">
          <Select
            value={selectedPlatform}
            onValueChange={(value) => setSelectedPlatform(value as Platform)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="uniswap">Uniswap V3</SelectItem>
              <SelectItem value="pancakeswap">PancakeSwap V3</SelectItem>
            </SelectContent>
          </Select>
          {isConnected && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
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
      ) : filteredPools.length > 0 ? (
        <div className="grid gap-4">
          {filteredPools.map((pool) => (
            <Card key={pool.id} className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">
                      {pool.token0}/{pool.token1}
                    </h3>
                    <span className="text-xs px-2 py-1 bg-accent rounded-full">
                      {pool.platform === 'uniswap' ? 'Uniswap' : 'PancakeSwap'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Fee Tier: {pool.feeTier / 10000}%
                  </p>
                </div>
                <div className="text-right">
                  <div className="space-y-1">
                    <p className="text-sm">
                      ETH Price: ${pool.token1Price.toFixed(2)}
                    </p>
                    <p className="text-sm">
                      Liquidity: {formatLiquidity(pool.liquidity)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-muted-foreground">View on:</span>
                    <a
                      href={getPlatformUrl(pool.address, pool.platform)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      {pool.platform === 'uniswap' ? 'Uniswap' : 'PancakeSwap'} <ExternalLink className="h-3 w-3" />
                    </a>
                    <span className="text-muted-foreground">|</span>
                    <a
                      href={getExplorerLink(pool.address, pool.platform)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      {getPlatformExplorerName(pool.platform)} <ExternalLink className="h-3 w-3" />
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
                onClick={() => refetch()}
                className="mt-4"
              >
                Try Again
              </Button>
            </>
          ) : (
            <p className="text-muted-foreground">
              Connect your wallet to view liquidity pools
            </p>
          )}
        </Card>
      )}
    </div>
  );
}