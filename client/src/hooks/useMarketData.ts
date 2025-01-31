import { useQuery } from "@tanstack/react-query";

export interface MarketData {
  indicators: Array<{
    name: string;
    value: number;
    signal: 'buy' | 'sell' | 'neutral';
    description: string; // Added description for tooltips
    learnMoreUrl: string; // Added URL for detailed explanation
  }>;
}

export function useMarketData() {
  return useQuery<MarketData>({
    queryKey: ['/api/market-data'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}