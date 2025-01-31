import { useQuery } from "@tanstack/react-query";

interface PredictionsData {
  rangeLow: number;
  rangeHigh: number;
  confidence: number;
}

export function usePredictions() {
  return useQuery<PredictionsData>({
    queryKey: ['/api/predictions'],
  });
}
