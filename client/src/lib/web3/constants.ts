// Contract addresses & ABIs
export const CONTRACTS = {
  USDC: {
    // BSC Testnet USDC contract address - replace with mainnet for production
    address: '0x64544969ed7EBf5f083679233325356EbE738930',
    abi: [
      'function balanceOf(address account) external view returns (uint256)',
      'function approve(address spender, uint256 amount) external returns (bool)',
      'function decimals() external view returns (uint8)'
    ]
  },
  STRATEGY: {
    // Mock strategy contract address - replace with actual contract
    address: '0x1234567890123456789012345678901234567890',
    abi: [
      'function deposit(uint256 amount) external',
      'function requestWithdrawal(uint256 amount) external',
      'function balanceOf(address account) external view returns (uint256)'
    ]
  }
};

export const CONTRACT_METADATA = {
  'RWBNB-USDC': {
    name: 'RWBNB-USDC',
    pair: 'WBNB-USDC',
    poolService: 'PancakeSwap',
    address: CONTRACTS.STRATEGY.address
  }
};

export const BSC_CHAIN_ID = 56; // Use 97 for testnet
