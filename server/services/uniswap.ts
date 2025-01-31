import { Pool, computePoolAddress, tickToPrice } from '@uniswap/v3-sdk';
import { Token } from '@uniswap/sdk-core';
import { ethers } from 'ethers';
import NodeCache from 'node-cache';
import { GraphQLClient } from 'graphql-request';

const cache = new NodeCache({ stdTTL: 300 }); // Cache for 5 minutes
const INFURA_URL = `https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`;

// Uniswap V3 Factory address
const FACTORY_ADDRESS = '0x1F98431c8aD98523631AE4a59f267346ea31F984';

// Updated Uniswap V3 Graph API URL (using the decentralized network)
const UNISWAP_GRAPH_URL = 'https://api.studio.thegraph.com/query/50589/uniswap-v3/v0.0.1';
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
];

// Updated GraphQL query for the new API
const POOLS_QUERY = `
  {
    pools(
      first: 10,
      orderBy: totalValueLockedUSD,
      orderDirection: desc,
      where: {
        token0_in: ["${POPULAR_TOKENS.WETH.address.toLowerCase()}", "${POPULAR_TOKENS.USDC.address.toLowerCase()}"],
        token1_in: ["${POPULAR_TOKENS.WETH.address.toLowerCase()}", "${POPULAR_TOKENS.USDC.address.toLowerCase()}"]
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
      liquidity
      sqrtPrice
      token0Price
      token1Price
      totalValueLockedToken0
      totalValueLockedToken1
      volumeUSD
    }
  }
`;

export async function getUniswapPools() {
  const cacheKey = 'uniswap_pools';
  const cachedPools = cache.get(cacheKey);

  if (cachedPools) {
    return { pools: cachedPools };
  }

  try {
    // Fetch top pools from Graph API
    const data: any = await graphClient.request(POOLS_QUERY);
    if (!data || !data.pools) {
      console.warn('No pools data received from Graph API');
      return { pools: [] };
    }

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
        const [slot0] = await Promise.all([
          poolContract.slot0(),
        ]);

        // Convert values to appropriate format
        const token0Amount = graphPool.totalValueLockedToken0;
        const token1Amount = graphPool.totalValueLockedToken1;

        pools.push({
          id: graphPool.id,
          address: graphPool.id,
          token0: graphPool.token0.symbol,
          token1: graphPool.token1.symbol,
          feeTier: parseInt(graphPool.feeTier),
          liquidity: graphPool.liquidity,
          token0Price: parseFloat(graphPool.token0Price).toFixed(6),
          token1Price: parseFloat(graphPool.token1Price).toFixed(6),
          token0Amount: token0Amount,
          token1Amount: token1Amount,
          volumeUSD: graphPool.volumeUSD
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

    return { pools };
  } catch (error) {
    console.error('Failed to fetch Uniswap pools:', error);
    // Return an empty array instead of throwing
    return { pools: [] };
  }
}