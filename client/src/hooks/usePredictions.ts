import { useQuery } from "@tanstack/react-query";

interface PredictionsData {
  rangeLow: number;
  rangeHigh: number;
  confidence: number;
  timestamp: number;
}

export function usePredictions() {
  return useQuery<PredictionsData>({
    queryKey: ['/api/predictions'],
    refetchInterval: 60000, // Refetch every minute
  });
}