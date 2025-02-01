import { GraphQLClient } from 'graphql-request';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 }); // Cache for 5 minutes
// Updated PancakeSwap V3 Graph API URL for BSC
const PANCAKESWAP_GRAPH_URL = 'https://api.thegraph.com/subgraphs/name/pancakeswap/exchange-v3-eth';
const graphClient = new GraphQLClient(PANCAKESWAP_GRAPH_URL);

// Similar query structure for ETH/USDC pairs on PancakeSwap
const POOLS_QUERY = `
  {
    pools(
      first: 10,
      orderBy: totalValueLockedUSD,
      orderDirection: desc,
      where: {
        token0_in: ["0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"],
        token1_in: ["0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"]
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
      token0Price
      token1Price
      totalValueLockedToken0
      totalValueLockedToken1
      volumeUSD
    }
  }
`;

export async function getPancakeswapPools() {
  const cacheKey = 'pancakeswap_pools';
  const cachedPools = cache.get(cacheKey);

  if (cachedPools) {
    return { pools: cachedPools };
  }

  try {
    const data: any = await graphClient.request(POOLS_QUERY);
    if (!data || !data.pools) {
      console.warn('No pools data received from PancakeSwap Graph API');
      return { pools: [] };
    }

    const pools = data.pools.map((pool: any) => ({
      id: pool.id,
      address: pool.id,
      token0: 'ETH', // Display ETH instead of WETH
      token1: pool.token1.symbol,
      feeTier: parseInt(pool.feeTier),
      liquidity: pool.liquidity,
      token0Price: parseFloat(pool.token0Price).toFixed(6),
      token1Price: parseFloat(pool.token1Price).toFixed(6),
      token0Amount: pool.totalValueLockedToken0,
      token1Amount: pool.totalValueLockedToken1,
      volumeUSD: pool.volumeUSD,
      platform: 'pancakeswap'
    }));

    if (pools.length > 0) {
      cache.set(cacheKey, pools);
    }

    return { pools };
  } catch (error) {
    console.error('Failed to fetch PancakeSwap pools:', error);
    return { pools: [] };
  }
}