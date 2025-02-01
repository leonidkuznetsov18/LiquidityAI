import { useQuery } from "@tanstack/react-query";

export interface MarketData {
  price24h: {
    current: number;
    change: number;
    changePercentage: number;
  };
  volume24h: {
    total: number;
    buy: number;
    sell: number;
  };
  indicators: Array<{
    name: string;
    value: number;
    signal: 'buy' | 'sell' | 'neutral';
    description: string;
    learnMoreUrl: string;
  }>;
}

export function useMarketData() {
  return useQuery<MarketData>({
    queryKey: ['/api/market-data'],
  });
}