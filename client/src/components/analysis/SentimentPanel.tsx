import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useSentiment } from "@/hooks/useSentiment";
import { Skeleton } from "@/components/ui/skeleton";
import { SiX, SiCoinmarketcap } from "react-icons/si";

export default function SentimentPanel() {
  const { data: sentiment, isLoading } = useSentiment();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Market Sentiment</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
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
            <SiX className="h-4 w-4" />
            <span>Twitter Sentiment</span>
          </div>
          <Progress value={sentiment?.twitter.score ? sentiment.twitter.score * 100 : 0} className="h-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Bearish</span>
            <span>Bullish</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <SiCoinmarketcap className="h-4 w-4" />
            <span>News Sentiment</span>
          </div>
          <Progress value={sentiment?.news.score ? sentiment.news.score * 100 : 0} className="h-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Negative</span>
            <span>Positive</span>
          </div>
        </div>

        <div className="bg-card rounded-lg p-4">
          <h3 className="font-medium mb-2">Key Mentions</h3>
          <ul className="space-y-2 text-sm">
            {sentiment?.news.headlines.map((headline, i) => (
              <li key={i} className="line-clamp-1">{headline}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}