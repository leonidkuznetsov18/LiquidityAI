import { Pool, computePoolAddress, tickToPrice } from '@uniswap/v3-sdk';
import { Token } from '@uniswap/sdk-core';
import { ethers } from 'ethers';
import NodeCache from 'node-cache';
import { GraphQLClient } from 'graphql-request';

const cache = new NodeCache({ stdTTL: 300 }); // Cache for 5 minutes
const INFURA_URL = `https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`;

// Uniswap V3 Factory address
const FACTORY_ADDRESS = '0x1F98431c8aD98523631AE4a59f267346ea31F984';

// Uniswap V3 Graph API
const UNISWAP_GRAPH_URL = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3';
const graphClient = new GraphQLClient(UNISWAP_GRAPH_URL);

// Popular tokens for tracking
const POPULAR_TOKENS = {
  WETH: {
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    symbol: 'WETH',
    decimals: 18,
  },
  USDC: {
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    symbol: 'USDC',
    decimals: 6,
  },
};

// Uniswap V3 Pool ABI (minimal)
const POOL_ABI = [
  'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
  'function liquidity() external view returns (uint128)',
  'function positions(bytes32) external view returns (uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)',
];

const POOLS_QUERY = `
  query GetTopPools {
    pools(
      first: 10,
      orderBy: totalValueLockedUSD,
      orderDirection: desc,
      where: {
        token0_in: ["${POPULAR_TOKENS.WETH.address}", "${POPULAR_TOKENS.USDC.address}"],
        token1_in: ["${POPULAR_TOKENS.WETH.address}", "${POPULAR_TOKENS.USDC.address}"]
      }
    ) {
      id
      feeTier
      token0 {
        id
        symbol
        decimals
      }
      token1 {
        id
        symbol
        decimals
      }
      totalValueLockedToken0
      totalValueLockedToken1
      token0Price
      token1Price
    }
  }
`;

function calculateTokenAmounts(liquidity: string, sqrtPriceX96: string, tick: number) {
  try {
    const liquidityBN = BigInt(liquidity);
    const sqrtPriceX96BN = BigInt(sqrtPriceX96);
    const Q96 = BigInt(2) ** BigInt(96);

    // Calculate token amounts based on the current price
    const amount0 = (liquidityBN * Q96) / sqrtPriceX96BN;
    const amount1 = (liquidityBN * sqrtPriceX96BN) / Q96;

    return {
      amount0: amount0.toString(),
      amount1: amount1.toString(),
    };
  } catch (error) {
    console.error('Error calculating token amounts:', error);
    return {
      amount0: '0',
      amount1: '0',
    };
  }
}

export async function getUniswapPools() {
  const cacheKey = 'uniswap_pools';
  const cachedPools = cache.get(cacheKey);

  if (cachedPools) {
    return cachedPools;
  }

  try {
    // Fetch top pools from Graph API
    const data = await graphClient.request(POOLS_QUERY);
    const graphPools = data.pools;

    const provider = new ethers.JsonRpcProvider(INFURA_URL);
    const pools = [];

    for (const graphPool of graphPools) {
      try {
        const token0 = new Token(
          1, // mainnet
          graphPool.token0.id,
          parseInt(graphPool.token0.decimals),
          graphPool.token0.symbol
        );

        const token1 = new Token(
          1,
          graphPool.token1.id,
          parseInt(graphPool.token1.decimals),
          graphPool.token1.symbol
        );

        // Create contract instance for additional data
        const poolContract = new ethers.Contract(
          graphPool.id,
          POOL_ABI,
          provider
        );

        // Fetch current pool state
        const [slot0, liquidity] = await Promise.all([
          poolContract.slot0(),
          poolContract.liquidity(),
        ]);

        const sqrtPriceX96 = slot0[0].toString();
        const tick = Number(slot0[1]);

        // Calculate current amounts in the pool
        const { amount0, amount1 } = calculateTokenAmounts(
          graphPool.totalValueLockedToken0,
          sqrtPriceX96,
          tick
        );

        pools.push({
          id: graphPool.id,
          address: graphPool.id,
          token0: token0.symbol,
          token1: token1.symbol,
          feeTier: parseInt(graphPool.feeTier),
          liquidity: liquidity.toString(),
          token0Price: parseFloat(graphPool.token0Price).toFixed(6),
          token1Price: parseFloat(graphPool.token1Price).toFixed(6),
          token0Amount: graphPool.totalValueLockedToken0,
          token1Amount: graphPool.totalValueLockedToken1,
        });
      } catch (error) {
        console.error(`Failed to fetch pool data: ${graphPool.id}`, error);
        // Continue with other pools even if one fails
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