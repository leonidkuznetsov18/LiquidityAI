import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Props {
  predictions?: {
    rangeLow: number;
    rangeHigh: number;
    confidence: number;
  };
}

export default function RangeAdjuster({ predictions }: Props) {
  const { toast } = useToast();
  const [range, setRange] = useState<[number, number]>([
    predictions?.rangeLow || 1800,
    predictions?.rangeHigh || 2200,
  ]);

  // Update range when predictions change
  useEffect(() => {
    if (predictions) {
      setRange([predictions.rangeLow, predictions.rangeHigh]);
    }
  }, [predictions]);

  const handleApply = async () => {
    try {
      await apiRequest("POST", "/api/range", {
        low: range[0],
        high: range[1],
      });
      toast({
        title: "Range Updated",
        description: "New liquidity range has been set successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update range. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReset = () => {
    if (predictions) {
      setRange([predictions.rangeLow, predictions.rangeHigh]);
    }
  };

  // Calculate min and max based on current price range
  const minPrice = predictions ? Math.floor(predictions.rangeLow * 0.8) : 1500;
  const maxPrice = predictions ? Math.ceil(predictions.rangeHigh * 1.2) : 2500;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Liquidity Range</h2>

      <div className="space-y-8">
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm text-muted-foreground">Lower Bound ($)</label>
              <Input
                type="number"
                value={range[0].toFixed(2)}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value) && value < range[1]) {
                    setRange([value, range[1]]);
                  }
                }}
                className="font-mono"
              />
            </div>
            <div className="flex-1">
              <label className="text-sm text-muted-foreground">Upper Bound ($)</label>
              <Input
                type="number"
                value={range[1].toFixed(2)}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value) && value > range[0]) {
                    setRange([range[0], value]);
                  }
                }}
                className="font-mono"
              />
            </div>
          </div>

          <div className="pt-4 relative h-12">
            {/* Track background */}
            <div className="absolute inset-y-1/2 w-full h-1 -translate-y-1/2 bg-muted rounded-full">
              {/* Active range */}
              <div 
                className="absolute h-full bg-primary rounded-full"
                style={{
                  left: `${((range[0] - minPrice) / (maxPrice - minPrice)) * 100}%`,
                  right: `${100 - ((range[1] - minPrice) / (maxPrice - minPrice)) * 100}%`
                }}
              />
            </div>

            {/* Lower handle */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-primary border-2 border-background rounded-full cursor-pointer"
              style={{
                left: `${((range[0] - minPrice) / (maxPrice - minPrice)) * 100}%`
              }}
              onMouseDown={(e) => {
                const startX = e.pageX;
                const startValue = range[0];

                const handleMouseMove = (e: MouseEvent) => {
                  const dx = e.pageX - startX;
                  const range = maxPrice - minPrice;
                  const newValue = Math.max(
                    minPrice,
                    Math.min(range[1] - 10, startValue + (dx / window.innerWidth) * range)
                  );
                  setRange([newValue, range[1]]);
                };

                const handleMouseUp = () => {
                  window.removeEventListener('mousemove', handleMouseMove);
                  window.removeEventListener('mouseup', handleMouseUp);
                };

                window.addEventListener('mousemove', handleMouseMove);
                window.addEventListener('mouseup', handleMouseUp);
              }}
            />

            {/* Upper handle */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-primary border-2 border-background rounded-full cursor-pointer"
              style={{
                left: `${((range[1] - minPrice) / (maxPrice - minPrice)) * 100}%`
              }}
              onMouseDown={(e) => {
                const startX = e.pageX;
                const startValue = range[1];

                const handleMouseMove = (e: MouseEvent) => {
                  const dx = e.pageX - startX;
                  const range = maxPrice - minPrice;
                  const newValue = Math.max(
                    range[0] + 10,
                    Math.min(maxPrice, startValue + (dx / window.innerWidth) * range)
                  );
                  setRange([range[0], newValue]);
                };

                const handleMouseUp = () => {
                  window.removeEventListener('mousemove', handleMouseMove);
                  window.removeEventListener('mouseup', handleMouseUp);
                };

                window.addEventListener('mousemove', handleMouseMove);
                window.addEventListener('mouseup', handleMouseUp);
              }}
            />

            {/* Price labels */}
            <div className="absolute w-full flex justify-between mt-6 text-sm text-muted-foreground">
              <span>${minPrice.toFixed(2)}</span>
              <span>${maxPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Button onClick={handleApply} className="flex-1">
            Apply Range
          </Button>
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!predictions}
            className="flex-1"
          >
            Reset to AI Suggestion
          </Button>
        </div>
      </div>
    </div>
  );
}