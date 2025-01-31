import { Pool, computePoolAddress } from '@uniswap/v3-sdk';
import { Token } from '@uniswap/sdk-core';
import { ethers } from 'ethers';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 }); // Cache for 5 minutes
const INFURA_URL = `https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`;

// Uniswap V3 Factory address
const FACTORY_ADDRESS = '0x1F98431c8aD98523631AE4a59f267346ea31F984';

const POPULAR_PAIRS = [
  {
    token0: {
      address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
      symbol: 'WETH',
      decimals: 18,
    },
    token1: {
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
      symbol: 'USDC',
      decimals: 6,
    },
    feeTiers: [500, 3000, 10000], // 0.05%, 0.3%, 1%
  },
];

// Uniswap V3 Pool ABI (minimal)
const POOL_ABI = [
  'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
  'function liquidity() external view returns (uint128)',
  'function positions(bytes32) external view returns (uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)',
];

function calculateTokenAmounts(liquidity: bigint, sqrtPriceX96: bigint, tickLower: number, tickUpper: number) {
  const Q96 = 2n ** 96n;

  // Calculate token amounts based on the liquidity formula
  // This is a simplified calculation and might not be 100% accurate
  const amount0 = (liquidity * Q96) / sqrtPriceX96;
  const amount1 = liquidity * sqrtPriceX96 / Q96;

  return {
    amount0: amount0.toString(),
    amount1: amount1.toString(),
  };
}

export async function getUniswapPools() {
  const cacheKey = 'uniswap_pools';
  const cachedPools = cache.get(cacheKey);

  if (cachedPools) {
    return cachedPools;
  }

  try {
    const provider = new ethers.JsonRpcProvider(INFURA_URL);
    const pools: any[] = [];

    for (const pair of POPULAR_PAIRS) {
      const token0 = new Token(
        1, // mainnet
        pair.token0.address,
        pair.token0.decimals,
        pair.token0.symbol
      );

      const token1 = new Token(
        1,
        pair.token1.address,
        pair.token1.decimals,
        pair.token1.symbol
      );

      for (const feeTier of pair.feeTiers) {
        try {
          // Compute pool address
          const poolAddress = computePoolAddress({
            factoryAddress: FACTORY_ADDRESS,
            tokenA: token0,
            tokenB: token1,
            fee: feeTier,
          });

          // Create contract instance
          const poolContract = new ethers.Contract(
            poolAddress,
            POOL_ABI,
            provider
          );

          // Fetch pool data
          const [slot0, liquidity] = await Promise.all([
            poolContract.slot0(),
            poolContract.liquidity(),
          ]);

          const sqrtPriceX96 = slot0[0];
          const tick = slot0[1];

          // Calculate token amounts
          const { amount0, amount1 } = calculateTokenAmounts(
            BigInt(liquidity.toString()),
            BigInt(sqrtPriceX96.toString()),
            Math.floor(tick / 60) * 60, // Approximate tick range
            Math.ceil(tick / 60) * 60
          );

          // Calculate prices
          const token0Price = (Number(sqrtPriceX96) * Number(sqrtPriceX96) * (10 ** token1.decimals)) / 
                            ((2 ** 192) * (10 ** token0.decimals));

          const token1Price = 1 / token0Price;

          pools.push({
            id: `${token0.address}-${token1.address}-${feeTier}`,
            address: poolAddress,
            token0: token0.symbol,
            token1: token1.symbol,
            feeTier,
            liquidity: liquidity.toString(),
            token0Price: token0Price.toFixed(6),
            token1Price: token1Price.toFixed(6),
            token0Amount: amount0,
            token1Amount: amount1,
          });
        } catch (error) {
          console.error(`Failed to fetch pool for ${token0.symbol}/${token1.symbol} ${feeTier}:`, error);
          // Continue with other pools even if one fails
        }
      }
    }

    // Only cache if we have data
    if (pools.length > 0) {
      cache.set(cacheKey, pools);
    }

    return pools;
  } catch (error) {
    console.error('Failed to fetch Uniswap pools:', error);
    throw error;
  }
}