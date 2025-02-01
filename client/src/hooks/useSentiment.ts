import { useQuery } from "@tanstack/react-query";

interface NewsItem {
  title: string;
  url: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

interface SentimentData {
  news: {
    score: number;
    headlines: NewsItem[];
  };
}

export function useSentiment() {
  return useQuery<SentimentData>({
    queryKey: ['/api/sentiment'],
  });
}