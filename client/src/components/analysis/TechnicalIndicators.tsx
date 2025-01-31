import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpIcon, ArrowDownIcon, MinusIcon, InfoIcon } from "lucide-react";
import type { MarketData, Indicator } from "@/hooks/useMarketData";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
  data?: MarketData;
  isLoading: boolean;
}

function IndicatorTooltip({ indicator }: { indicator: Indicator }) {
  if (!indicator.details) return null;

  const content = [];
  if ('upper' in indicator.details) {
    content.push(
      <div key="bb" className="space-y-1">
        <div>Upper Band: ${indicator.details.upper?.toFixed(2)}</div>
        <div>Middle Band: ${indicator.details.middle?.toFixed(2)}</div>
        <div>Lower Band: ${indicator.details.lower?.toFixed(2)}</div>
      </div>
    );
  }
  if ('ma20' in indicator.details) {
    content.push(
      <div key="ma" className="space-y-1">
        <div>MA20: ${indicator.details.ma20?.toFixed(2)}</div>
        <div>MA50: ${indicator.details.ma50?.toFixed(2)}</div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <InfoIcon className="h-4 w-4 text-muted-foreground" />
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-2">
            {content}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function TechnicalIndicators({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Technical Analysis</h2>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
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

  const getSignalColor = (signal: 'buy' | 'sell' | 'neutral') => {
    switch (signal) {
      case 'buy':
        return 'text-green-500';
      case 'sell':
        return 'text-red-500';
      default:
        return 'text-yellow-500';
    }
  };

  const getProgressValue = (indicator: Indicator): number => {
    switch (indicator.name) {
      case 'RSI (14)':
        return indicator.value;
      case 'MACD':
        return ((indicator.value + 100) / 200) * 100; // Normalize to 0-100
      case 'Price Rate of Change':
        return ((indicator.value + 20) / 40) * 100; // Normalize -20 to +20
      default:
        return 50; // Default neutral position
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Technical Analysis</h2>
      <div className="space-y-3">
        {data?.indicators.map((indicator) => (
          <div
            key={indicator.name}
            className="p-3 bg-card rounded-lg space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">{indicator.name}</span>
                {indicator.details && <IndicatorTooltip indicator={indicator} />}
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-mono ${getSignalColor(indicator.signal)}`}>
                  {indicator.value.toFixed(2)}
                </span>
                {getSignalIcon(indicator.signal)}
              </div>
            </div>

            {['RSI (14)', 'MACD', 'Price Rate of Change'].includes(indicator.name) && (
              <div className="space-y-1">
                <Progress value={getProgressValue(indicator)} className="h-1" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  {indicator.name === 'RSI (14)' && (
                    <>
                      <span>Oversold</span>
                      <span>Overbought</span>
                    </>
                  )}
                  {indicator.name === 'MACD' && (
                    <>
                      <span>Bearish</span>
                      <span>Bullish</span>
                    </>
                  )}
                  {indicator.name === 'Price Rate of Change' && (
                    <>
                      <span>Falling</span>
                      <span>Rising</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}