import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';

// Network configurations
const INFURA_API_URL = `https://mainnet.infura.io/v3/${import.meta.env.VITE_INFURA_PROJECT_ID}`;
const BSC_API_URL = 'https://bsc-dataseed.binance.org';

// Factory addresses
const UNISWAP_V3_FACTORY = '0x1F98431c8aD98523631AE4a59f267346ea31F984';
const PANCAKESWAP_V3_FACTORY = '0x1097053Fd2ea711dad45caCcc45EfF7548fCB362';

// Token addresses
const ETH_ADDRESS = '0xC02aaa39b223FE8D0A0e5C4F27eAD9083C756Cc2'; // WETH on Ethereum
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606e48c'; // USDC on Ethereum
const BSC_WETH_ADDRESS = '0x2170Ed0880ac9A755fd29B2688956BD959F933F8'; // WETH on BSC
const BSC_USDC_ADDRESS = '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d'; // USDC on BSC

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

// Fee tiers
const UNISWAP_FEE_TIERS = [500, 3000, 10000]; // 0.05%, 0.3%, 1%
const PANCAKESWAP_FEE_TIERS = [500, 2500, 10000]; // 0.05%, 0.25%, 1%

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
  const provider = new ethers.JsonRpcProvider(INFURA_API_URL);
  const factoryContract = new ethers.Contract(UNISWAP_V3_FACTORY, FACTORY_ABI, provider);
  const pools: Pool[] = [];

  for (const feeTier of UNISWAP_FEE_TIERS) {
    try {
      const poolAddress = await factoryContract.getPool(ETH_ADDRESS, USDC_ADDRESS, feeTier);

      if (poolAddress !== ethers.ZeroAddress) {
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
}

async function fetchPancakeswapPools(): Promise<Pool[]> {
  const provider = new ethers.JsonRpcProvider(BSC_API_URL);
  const factoryContract = new ethers.Contract(PANCAKESWAP_V3_FACTORY, FACTORY_ABI, provider);
  const pools: Pool[] = [];

  for (const feeTier of PANCAKESWAP_FEE_TIERS) {
    try {
      const poolAddress = await factoryContract.getPool(BSC_WETH_ADDRESS, BSC_USDC_ADDRESS, feeTier);

      if (poolAddress !== ethers.ZeroAddress) {
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
}

export function usePools() {
  return useQuery({
    queryKey: ['/pools'],
    queryFn: async () => {
      const [uniswapPools, pancakeswapPools] = await Promise.all([
        fetchUniswapPools(),
        fetchPancakeswapPools()
      ]);

      return [...uniswapPools, ...pancakeswapPools];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}