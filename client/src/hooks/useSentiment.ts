import { useQuery } from "@tanstack/react-query";

interface SentimentData {
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