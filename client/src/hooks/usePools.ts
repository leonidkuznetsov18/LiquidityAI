import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { useToast } from '@/hooks/use-toast';

// Network configurations
const INFURA_PROJECT_ID = import.meta.env.VITE_INFURA_PROJECT_ID;
const INFURA_API_URL = INFURA_PROJECT_ID 
  ? `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`
  : null;
console.log('INFURA_PROJECT_ID', INFURA_PROJECT_ID)
console.log('INFURA_API_URL', INFURA_API_URL)
const BSC_API_URL = 'https://bsc-dataseed.binance.org';

// Factory addresses
const UNISWAP_V3_FACTORY = '0x1F98431c8aD98523631AE4a59f267346ea31F984';
const PANCAKESWAP_V3_FACTORY = '0x1097053Fd2ea711dad45caCcc45EfF7548fCB362';

// Token addresses
const ETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const BSC_WETH_ADDRESS = '0x2170Ed0880ac9A755fd29B2688956BD959F933F8';
const BSC_USDC_ADDRESS = '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d';

// Known working fee tiers for each platform
const UNISWAP_FEE_TIERS = [500, 3000]; // 0.05%, 0.3% - most liquid pairs
const PANCAKESWAP_FEE_TIERS = [2500]; // 0.25% - most liquid pair on BSC

const FACTORY_ABI = [
  "function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address)"
];

const POOL_ABI = [
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'function fee() external view returns (uint24)',
  'function liquidity() external view returns (uint128)',
  'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
];

interface Pool {
  id: string;
  address: string;
  token0: string;
  token1: string;
  feeTier: number;
  liquidity: string;
  token0Price: number;
  token1Price: number;
  platform: 'uniswap' | 'pancakeswap';
}

async function fetchUniswapPools(): Promise<Pool[]> {
  if (!INFURA_API_URL) {
    console.error('INFURA_PROJECT_ID environment variable is not set');
    return [];
  }

  try {
    const provider = new ethers.JsonRpcProvider(INFURA_API_URL);
    await provider.getNetwork(); // Verify provider connection

    // Create contract instance
    const factoryContract = new ethers.Contract(
      UNISWAP_V3_FACTORY,
      FACTORY_ABI,
      provider
    );

    const pools: Pool[] = [];

    for (const feeTier of UNISWAP_FEE_TIERS) {
      try {
        const poolAddress = await factoryContract.getPool(
          ETH_ADDRESS,
          USDC_ADDRESS,
          feeTier
        );

        if (poolAddress && poolAddress !== ethers.ZeroAddress) {
          const poolContract = new ethers.Contract(poolAddress, POOL_ABI, provider);

          const [liquidity, slot0] = await Promise.all([
            poolContract.liquidity(),
            poolContract.slot0(),
          ]);

          const sqrtPriceX96 = slot0[0];
          const price = parseFloat(ethers.formatUnits(
            (sqrtPriceX96 * sqrtPriceX96).toString(),
            18
          ));

          pools.push({
            id: poolAddress,
            address: poolAddress,
            token0: 'ETH',
            token1: 'USDC',
            feeTier,
            liquidity: liquidity.toString(),
            token0Price: price,
            token1Price: 1 / price,
            platform: 'uniswap'
          });
        }
      } catch (error) {
        console.error(`Failed to fetch Uniswap pool for fee tier ${feeTier}:`, error);
      }
    }

    return pools;
  } catch (error) {
    console.error('Failed to initialize Ethereum provider:', error);
    return [];
  }
}

async function fetchPancakeswapPools(): Promise<Pool[]> {
  try {
    const provider = new ethers.JsonRpcProvider(BSC_API_URL);
    await provider.getNetwork(); // Verify provider connection

    const factoryContract = new ethers.Contract(
      PANCAKESWAP_V3_FACTORY,
      FACTORY_ABI,
      provider
    );

    const pools: Pool[] = [];

    for (const feeTier of PANCAKESWAP_FEE_TIERS) {
      try {
        const poolAddress = await factoryContract.getPool(
          BSC_WETH_ADDRESS,
          BSC_USDC_ADDRESS,
          feeTier
        );

        if (poolAddress && poolAddress !== ethers.ZeroAddress) {
          const poolContract = new ethers.Contract(poolAddress, POOL_ABI, provider);

          const [liquidity, slot0] = await Promise.all([
            poolContract.liquidity(),
            poolContract.slot0(),
          ]);

          const sqrtPriceX96 = slot0[0];
          const price = parseFloat(ethers.formatUnits(
            (sqrtPriceX96 * sqrtPriceX96).toString(),
            18
          ));

          pools.push({
            id: poolAddress,
            address: poolAddress,
            token0: 'ETH',
            token1: 'USDC',
            feeTier,
            liquidity: liquidity.toString(),
            token0Price: price,
            token1Price: 1 / price,
            platform: 'pancakeswap'
          });
        }
      } catch (error) {
        console.error(`Failed to fetch PancakeSwap pool for fee tier ${feeTier}:`, error);
      }
    }

    return pools;
  } catch (error) {
    console.error('Failed to initialize BSC provider:', error);
    return [];
  }
}

export function usePools() {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['/api/pools'],
    queryFn: async () => {
      try {
        if (!INFURA_PROJECT_ID) {
          toast({
            title: "Configuration Error",
            description: "Infura Project ID is not configured. Some features may be limited.",
            variant: "destructive",
          });
        }

        const [uniswapPools, pancakeswapPools] = await Promise.all([
          fetchUniswapPools().catch(error => {
            console.error('Uniswap pools fetch failed:', error);
            return [];
          }),
          fetchPancakeswapPools().catch(error => {
            console.error('PancakeSwap pools fetch failed:', error);
            return [];
          })
        ]);

        const allPools = [...uniswapPools, ...pancakeswapPools];
        if (allPools.length === 0) {
          throw new Error('No pools available from either platform');
        }

        return allPools;
      } catch (error) {
        console.error('Failed to fetch pools:', error);
        throw error;
      }
    },
    staleTime: 30000, // Consider data stale after 30 seconds
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: 3, // Retry failed requests 3 times
  });
}