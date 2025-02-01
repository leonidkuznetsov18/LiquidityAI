import { GraphQLClient } from 'graphql-request';

// PancakeSwap uses a different subgraph for BSC
const PANCAKESWAP_GRAPH_URL = 'https://api.thegraph.com/subgraphs/name/pancakeswap/exchange-v3-bsc';
const graphClient = new GraphQLClient(PANCAKESWAP_GRAPH_URL);

// ETH and USDC addresses on BSC
const WETH_BSC = '0x2170Ed0880ac9A755fd29B2688956BD959F933F8'.toLowerCase();
const USDC_BSC = '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d'.toLowerCase();

const POOLS_QUERY = `
  {
    pools(
      first: 10,
      orderBy: totalValueLockedUSD,
      orderDirection: desc,
      where: {
        and: [
          {
            token0_in: ["${WETH_BSC}"],
            token1: "${USDC_BSC}"
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

export async function getPancakeswapPools() {
  try {
    const data: any = await graphClient.request(POOLS_QUERY);

    if (!data?.pools) {
      console.warn('No pools data received from PancakeSwap Graph API');
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
      platform: 'pancakeswap'
    }));

    return { pools };
  } catch (error) {
    console.error('Failed to fetch PancakeSwap pools:', error);
    return { pools: [] };
  }
}