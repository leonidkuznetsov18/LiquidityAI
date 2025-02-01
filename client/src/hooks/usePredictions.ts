import { useQuery } from "@tanstack/react-query";

interface PredictionsData {
  rangeLow: number;
  rangeHigh: number;
  confidence: number;
  timestamp: number;
  explanation: string;
}

export function usePredictions() {
  return useQuery<PredictionsData>({
    queryKey: ['/api/predictions'],
    enabled: false, // Don't fetch automatically on mount
  });
}