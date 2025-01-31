import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpIcon, ArrowDownIcon, MinusIcon, InfoIcon, TrendingUp, TrendingDown } from "lucide-react";
import type { MarketData } from "@/hooks/useMarketData";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface Props {
  data?: MarketData;
  isLoading: boolean;
}

export default function TechnicalIndicators({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Technical Indicators</h2>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const formatNumber = (num: number) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(2);
  };

  const getSignalIcon = (signal: 'buy' | 'sell' | 'neutral') => {
    switch (signal) {
      case 'buy':
        return <ArrowUpIcon className="h-4 w-4 text-green-500" />;
      case 'sell':
        return <ArrowDownIcon className="h-4 w-4 text-red-500" />;
      default:
        return <MinusIcon className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Technical Indicators</h2>

      {/* 24h Statistics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-muted-foreground">Price (24h)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-mono">${data?.price24h.current.toFixed(2)}</span>
            <span className={`flex items-center text-sm ${
              data?.price24h.changePercentage! >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {data?.price24h.changePercentage! >= 0 ? (
                <TrendingUp className="h-4 w-4 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 mr-1" />
              )}
              {Math.abs(data?.price24h.changePercentage || 0).toFixed(2)}%
            </span>
          </div>
        </div>

        <div className="bg-card rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-muted-foreground">Volume (24h)</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Buy</span>
              <span className="font-mono text-green-500">${formatNumber(data?.volume24h.buy || 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Sell</span>
              <span className="font-mono text-red-500">${formatNumber(data?.volume24h.sell || 0)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between text-sm font-medium">
              <span>Total</span>
              <span className="font-mono">${formatNumber(data?.volume24h.total || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Technical Indicators */}
      <div className="space-y-2">
        {data?.indicators.map((indicator) => (
          <div
            key={indicator.name}
            className="flex items-center justify-between p-3 bg-card rounded-lg"
          >
            <div className="flex items-center gap-2">
              <span className="font-medium">{indicator.name}</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <InfoIcon className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="max-w-xs">
                      <p className="text-sm">{indicator.description}</p>
                      <a
                        href={indicator.learnMoreUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline mt-1 block"
                      >
                        Learn more →
                      </a>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono">{indicator.value.toFixed(2)}</span>
              {getSignalIcon(indicator.signal)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}