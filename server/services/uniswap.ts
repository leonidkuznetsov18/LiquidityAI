import { GraphQLClient } from 'graphql-request';

const UNISWAP_GRAPH_URL = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3';
const graphClient = new GraphQLClient(UNISWAP_GRAPH_URL);

// ETH and USDC addresses on Ethereum mainnet
const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'.toLowerCase();
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'.toLowerCase();

const POOLS_QUERY = `
  {
    pools(
      first: 10,
      orderBy: totalValueLockedUSD,
      orderDirection: desc,
      where: {
        and: [
          {
            token0_in: ["${WETH_ADDRESS}"],
            token1: "${USDC_ADDRESS}"
          }
        ]
      }
    ) {
      id
      feeTier
      liquidity
      token0Price
      token1Price
      totalValueLockedToken0
      totalValueLockedToken1
      volumeUSD
    }
  }
`;

export async function getUniswapPools() {
  try {
    const data: any = await graphClient.request(POOLS_QUERY);

    if (!data?.pools) {
      console.warn('No pools data received from Uniswap Graph API');
      return { pools: [] };
    }

    const pools = data.pools.map((pool: any) => ({
      id: pool.id,
      address: pool.id,
      token0: 'ETH',
      token1: 'USDC',
      feeTier: parseInt(pool.feeTier),
      token0Price: parseFloat(pool.token0Price),
      token1Price: parseFloat(pool.token1Price),
      token0Amount: pool.totalValueLockedToken0,
      token1Amount: pool.totalValueLockedToken1,
      volumeUSD: parseFloat(pool.volumeUSD),
      platform: 'uniswap'
    }));

    return { pools };
  } catch (error) {
    console.error('Failed to fetch Uniswap pools:', error);
    return { pools: [] };
  }
}