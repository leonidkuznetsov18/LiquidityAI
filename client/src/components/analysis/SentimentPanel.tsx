import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useSentiment } from "@/hooks/useSentiment";
import { Skeleton } from "@/components/ui/skeleton";
import { SiCoinmarketcap } from "react-icons/si";
import { ExternalLink } from "lucide-react";

export default function SentimentPanel() {
  const { data: sentiment, isLoading } = useSentiment();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Market Sentiment</h2>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Market Sentiment</h2>

      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <SiCoinmarketcap className="h-4 w-4" />
            <span>Market Sentiment</span>
          </div>
          <Progress value={sentiment?.news.score ? sentiment.news.score * 100 : 0} className="h-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Bearish</span>
            <span>Bullish</span>
          </div>
        </div>

        <div className="bg-card rounded-lg p-4">
          <h3 className="font-medium mb-4">Latest News</h3>
          <div className="space-y-3">
            {sentiment?.news.headlines.map((headline, i) => (
              <a
                key={i}
                href={headline.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`
                  flex items-center gap-2 text-sm hover:underline
                  ${headline.sentiment === 'positive' ? 'text-green-500' : ''}
                  ${headline.sentiment === 'negative' ? 'text-red-500' : ''}
                  ${headline.sentiment === 'neutral' ? 'text-muted-foreground' : ''}
                `}
              >
                <span className="line-clamp-2 flex-1">{headline.title}</span>
                <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-50" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}