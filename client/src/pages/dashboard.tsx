import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import TradingViewChart from "@/components/analysis/TradingViewChart";
import TechnicalIndicators from "@/components/analysis/TechnicalIndicators";
import SentimentPanel from "@/components/analysis/SentimentPanel";
import RangeAdjuster from "@/components/analysis/RangeAdjuster";
import Sidebar from "@/components/layout/Sidebar";
import { useMarketData } from "@/hooks/useMarketData";
import { usePredictions } from "@/hooks/usePredictions";
import { formatDistanceToNow } from "date-fns";
import { RefreshCw } from "lucide-react";
import PredictionExplanationDialog from "@/components/analysis/PredictionExplanationDialog";
import { useSentiment } from "@/hooks/useSentiment";
import ConnectButton from "@/components/web3/ConnectButton";
import { DepositWithdraw } from "@/components/DepositWithdraw";
import { useAccount } from "@/contexts/AccountContext";

export default function Dashboard() {
  const {
    data: marketData,
    isLoading: marketLoading,
    refetch: refetchMarket,
  } = useMarketData();
  const {
    data: predictions,
    refetch: refetchPredictions,
    isRefetching,
  } = usePredictions();

  const { refetch: refetchSentiment } = useSentiment();
  const { address } = useAccount();

  const handleRefresh = () => {
    refetchMarket();
    refetchPredictions();
    refetchSentiment();
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 p-6 space-y-6">
        <div className="flex justify-end">
          <ConnectButton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="col-span-2 p-4">
            <h2 className="text-lg font-semibold mb-4">BNB/USDC Price Chart</h2>
            <TradingViewChart />
          </Card>

          <div className="flex flex-col gap-4">
          <Card className="p-4 flex-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">AI Predictions</h2>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isRefetching}
                className={isRefetching ? "animate-spin" : ""}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            {predictions ? (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Optimal Range:</span>
                  <span className="font-mono">
                    ${predictions.rangeLow.toFixed(2)} - $
                    {predictions.rangeHigh.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Confidence:</span>
                  <span className="font-mono">
                    {predictions.confidence.toFixed(1)}%
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Updated {formatDistanceToNow(predictions.timestamp)} ago
                </div>
                <div className="flex justify-end mt-2">
                  <PredictionExplanationDialog
                    explanation={predictions.explanation}
                    rangeLow={predictions.rangeLow}
                    rangeHigh={predictions.rangeHigh}
                  />
                </div>
              </div>
            ) : (
              <div className="animate-pulse h-20 bg-muted rounded" />
            )}
          </Card>

          {/* Deposit & Withdraw section */}
          <Card className="p-4 flex-1">
            <h2 className="text-lg font-semibold mb-4">Deposit & Withdraw</h2>
            {address ? (
                <DepositWithdraw />
            ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    Connect your wallet to deposit or withdraw funds
                  </p>
                </div>
            )}
          </Card>
          </div>


          <Card className="p-4">
            <TechnicalIndicators data={marketData} isLoading={marketLoading} />
          </Card>

          <Card className="p-4">
            <SentimentPanel />
          </Card>

          <Card className="p-4">
            <RangeAdjuster predictions={predictions} />
          </Card>
        </div>
      </main>
    </div>
  );
}
