import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from "lucide-react";
import type { MarketData } from "@/hooks/useMarketData";

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
          {[1, 2, 3, 4].map((i) => (
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
            <span className="font-medium">{indicator.name}</span>
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