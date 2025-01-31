import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useSentiment } from "@/hooks/useSentiment";
import { Skeleton } from "@/components/ui/skeleton";
import { SiCoinmarketcap } from "react-icons/si";
import { ExternalLink, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

  const getSentimentIcon = (sentiment: 'positive' | 'negative' | 'neutral') => {
    switch (sentiment) {
      case 'positive':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'negative':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getSentimentBadge = (sentiment: 'positive' | 'negative' | 'neutral') => {
    const variants: Record<'positive' | 'negative' | 'neutral', string> = {
      positive: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      negative: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      neutral: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    };

    return (
      <Badge variant="outline" className={`${variants[sentiment]} ml-2`}>
        {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
      </Badge>
    );
  };

  const sentimentScore = sentiment?.news.score ? Math.round(sentiment.news.score * 100) : 0;
  const sentimentLabel = sentimentScore < 30 ? 'Bearish' : sentimentScore > 70 ? 'Bullish' : 'Neutral';
  const labelColor = sentimentScore < 30 ? 'text-red-500' : sentimentScore > 70 ? 'text-green-500' : 'text-yellow-500';

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Market Sentiment</h2>

      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SiCoinmarketcap className="h-4 w-4" />
              <span>Overall Sentiment</span>
            </div>
            <span className={`font-semibold ${labelColor}`}>
              {sentimentScore}% - {sentimentLabel}
            </span>
          </div>
          <Progress 
            value={sentimentScore} 
            className="h-2" 
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>0% - Extremely Bearish</span>
            <span>100% - Extremely Bullish</span>
          </div>
        </div>

        <div className="bg-card rounded-lg p-4">
          <h3 className="font-medium mb-4">Latest Crypto News</h3>
          <div className="space-y-4">
            {sentiment?.news.headlines.map((headline, i) => (
              <a
                key={i}
                href={headline.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {getSentimentIcon(headline.sentiment)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-2">
                      {headline.title}
                    </p>
                    {getSentimentBadge(headline.sentiment)}
                  </div>
                  <ExternalLink className="h-4 w-4 flex-shrink-0 opacity-50" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}