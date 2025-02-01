import { ethers } from 'ethers';

const PANCAKE_V3_FACTORY = '0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865';
const POOL_ABI = [
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'function fee() external view returns (uint24)',
  'function liquidity() external view returns (uint128)',
  'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
];

// ETH/USDC Pool Contract Addresses on BSC for different fee tiers
const ETH_USDC_POOLS_BSC = {
  '0x36696169c63e42cd08ce11f5deebbcebae652050': 2500, // 0.25%
  '0xd9e2a1a61b6e61b275cec326c9644463c6a334d1': 500,  // 0.05%
  '0x1ac1a8fe586f6e70a0732aa8a69b09f9c6a0cb7d': 10000 // 1%
};

export async function getPancakeswapPools() {
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed1.binance.org');
  const pools = [];

  for (const [poolAddress, fee] of Object.entries(ETH_USDC_POOLS_BSC)) {
    try {
      const poolContract = new ethers.Contract(poolAddress, POOL_ABI, provider);
      const [liquidity, slot0] = await Promise.all([
        poolContract.liquidity(),
        poolContract.slot0(),
      ]);

      const sqrtPriceX96 = slot0[0];
      const tick = slot0[1];

      // Calculate price from sqrtPriceX96
      const price = parseFloat(ethers.formatUnits(sqrtPriceX96.mul(sqrtPriceX96).div(2n ** 192n), 18));

      pools.push({
        id: poolAddress,
        address: poolAddress,
        token0: 'ETH',
        token1: 'USDC',
        feeTier: fee,
        liquidity: liquidity.toString(),
        token0Price: price,
        token1Price: 1 / price,
        platform: 'pancakeswap'
      });
    } catch (error) {
      console.error(`Failed to fetch PancakeSwap pool ${poolAddress}:`, error);
    }
  }

  return { pools };
}