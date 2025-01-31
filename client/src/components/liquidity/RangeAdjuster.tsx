import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Range, getTrackBackground } from "react-range";

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

          <div className="py-8">
            <Range
              values={range}
              step={0.01}
              min={minPrice}
              max={maxPrice}
              onChange={(values) => setRange(values as [number, number])}
              renderTrack={({ props, children }) => (
                <div
                  onMouseDown={props.onMouseDown}
                  onTouchStart={props.onTouchStart}
                  className="h-8 flex w-full"
                  style={props.style}
                >
                  <div
                    ref={props.ref}
                    className="h-1 w-full rounded-full self-center"
                    style={{
                      background: getTrackBackground({
                        values: range,
                        colors: ["#f1f5f9", "hsl(var(--primary))", "#f1f5f9"],
                        min: minPrice,
                        max: maxPrice,
                      }),
                    }}
                  >
                    {children}
                  </div>
                </div>
              )}
              renderThumb={({ props }) => (
                <div
                  {...props}
                  className="h-4 w-4 rounded-full bg-primary border-2 border-background focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-opacity-75"
                  style={{
                    ...props.style,
                    boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
              )}
            />
            <div className="flex justify-between mt-2 text-sm text-muted-foreground">
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