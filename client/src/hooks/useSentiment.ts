import { useQuery } from "@tanstack/react-query";

interface SentimentData {
  twitter: {
    score: number;
    volume: number;
  };
  news: {
    score: number;
    headlines: string[];
  };
}

export function useSentiment() {
  return useQuery<SentimentData>({
    queryKey: ['/api/sentiment'],
    refetchInterval: 60000, // Refetch every minute
  });
}
