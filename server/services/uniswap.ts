import { Token } from '@uniswap/sdk-core';
import { Pool, TickMath } from '@uniswap/v3-sdk';
import { ethers } from 'ethers';

const UNISWAP_V3_FACTORY = '0x1F98431c8aD98523631AE4a59f267346ea31F984';
const POOL_ABI = [
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'function fee() external view returns (uint24)',
  'function liquidity() external view returns (uint128)',
  'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
];

// ETH/USDC Pool Contract Addresses for different fee tiers
const ETH_USDC_POOLS = {
  '0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8': 3000, // 0.3%
  '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640': 500,  // 0.05%
  '0x7bea39867e4169dbe237d55c8242a8f2fcdcc387': 10000 // 1%
};

export async function getUniswapPools() {
  const provider = new ethers.JsonRpcProvider(`https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`);
  const pools = [];

  for (const [poolAddress, fee] of Object.entries(ETH_USDC_POOLS)) {
    try {
      const poolContract = new ethers.Contract(poolAddress, POOL_ABI, provider);
      const [liquidity, slot0] = await Promise.all([
        poolContract.liquidity(),
        poolContract.slot0(),
      ]);

      const sqrtPriceX96 = slot0[0];
      const tick = slot0[1];

      const price = parseFloat(ethers.formatUnits(
        TickMath.getSqrtRatioAtTick(tick).toString(),
        18
      ));

      pools.push({
        id: poolAddress,
        address: poolAddress,
        token0: 'ETH',
        token1: 'USDC',
        feeTier: fee,
        liquidity: liquidity.toString(),
        token0Price: price,
        token1Price: 1 / price,
        platform: 'uniswap'
      });
    } catch (error) {
      console.error(`Failed to fetch Uniswap pool ${poolAddress}:`, error);
    }
  }

  return { pools };
}