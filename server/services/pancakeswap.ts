import { ethers } from 'ethers';
import NodeCache from 'node-cache';
import { GraphQLClient } from 'graphql-request';

const cache = new NodeCache({ stdTTL: 300 }); // Cache for 5 minutes
const BNB_CHAIN_RPC = 'https://bsc-dataseed1.bnbchain.org';

// PancakeSwap V3 Factory address on BNB Chain
const FACTORY_ADDRESS = '0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865';

// PancakeSwap V3 Graph API
const PANCAKESWAP_GRAPH_URL = 'https://api.thegraph.com/subgraphs/name/pancakeswap/exchange-v3-bsc';
const graphClient = new GraphQLClient(PANCAKESWAP_GRAPH_URL);

// Popular tokens for tracking on BNB Chain
const POPULAR_TOKENS = {
  WBNB: {
    address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    symbol: 'WBNB',
    decimals: 18,
  },
  USDT: {
    address: '0x55d398326f99059fF775485246999027B3197955',
    symbol: 'USDT',
    decimals: 18,
  },
  CAKE: {
    address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
    symbol: 'CAKE',
    decimals: 18,
  },
};

// PancakeSwap V3 Pool ABI (minimal)
const POOL_ABI = [
  'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
  'function liquidity() external view returns (uint128)',
];

// GraphQL query for PancakeSwap pools
const POOLS_QUERY = `
  {
    pools(
      first: 10,
      orderBy: totalValueLockedUSD,
      orderDirection: desc,
      where: {
        token0_in: [
          "${POPULAR_TOKENS.WBNB.address.toLowerCase()}", 
          "${POPULAR_TOKENS.USDT.address.toLowerCase()}",
          "${POPULAR_TOKENS.CAKE.address.toLowerCase()}"
        ],
        token1_in: [
          "${POPULAR_TOKENS.WBNB.address.toLowerCase()}", 
          "${POPULAR_TOKENS.USDT.address.toLowerCase()}",
          "${POPULAR_TOKENS.CAKE.address.toLowerCase()}"
        ]
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

export async function getPancakeswapPools() {
  const cacheKey = 'pancakeswap_pools';
  const cachedPools = cache.get(cacheKey);

  if (cachedPools) {
    return { pools: cachedPools };
  }

  try {
    // Fetch top pools from Graph API
    const data: any = await graphClient.request(POOLS_QUERY);
    if (!data || !data.pools) {
      console.warn('No PancakeSwap pools data received from Graph API');
      return { pools: [] };
    }

    const graphPools = data.pools;
    const provider = new ethers.JsonRpcProvider(BNB_CHAIN_RPC);
    const pools = [];

    for (const graphPool of graphPools) {
      try {
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
          volumeUSD: graphPool.volumeUSD,
          platform: 'pancakeswap'
        });
      } catch (error) {
        console.error(`Failed to fetch PancakeSwap pool data: ${graphPool.id}`, error);
        // Continue with other pools even if one fails
      }
    }

    // Only cache if we have data
    if (pools.length > 0) {
      cache.set(cacheKey, pools);
    }

    return { pools };
  } catch (error) {
    console.error('Failed to fetch PancakeSwap pools:', error);
    // Return an empty array instead of throwing
    return { pools: [] };
  }
}
