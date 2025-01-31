import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpIcon, ArrowDownIcon, MinusIcon, InfoIcon } from "lucide-react";
import type { MarketData } from "@/hooks/useMarketData";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

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
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

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