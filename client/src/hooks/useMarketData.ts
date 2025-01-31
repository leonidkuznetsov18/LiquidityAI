import { useQuery } from "@tanstack/react-query";

export interface Indicator {
  name: string;
  value: number;
  signal: 'buy' | 'sell' | 'neutral';
  details?: {
    upper?: number;
    middle?: number;
    lower?: number;
    ma20?: number;
    ma50?: number;
  };
}

export interface MarketData {
  indicators: Indicator[];
}

export function useMarketData() {
  return useQuery<MarketData>({
    queryKey: ['/api/market-data'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}