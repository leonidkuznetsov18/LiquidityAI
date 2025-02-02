import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Range, getTrackBackground } from "react-range";

interface Props {
  predictions?: {
    rangeLow: number;
    rangeHigh: number;
    confidence: number;
  };
}
const MIN_PRICE = 200;
const MAX_PRICE = 800;
export default function RangeAdjuster({ predictions }: Props) {
  const [range, setRange] = useState<[number, number]>([
    predictions?.rangeLow || MIN_PRICE,
    predictions?.rangeHigh || MAX_PRICE,
  ]);

  useEffect(() => {
    if (predictions) {
      setRange([predictions.rangeLow, predictions.rangeHigh]);
    }
  }, [predictions]);

  const handleReset = () => {
    if (predictions) {
      setRange([predictions.rangeLow, predictions.rangeHigh]);
    }
  };

  const minPrice = predictions ? Math.floor(predictions.rangeLow * 0.8) : MIN_PRICE;
  const maxPrice = predictions ? Math.ceil(predictions.rangeHigh * 1.2) : MAX_PRICE;

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
              renderThumb={({ props, index }) => (
                <div
                  {...props}
                  key={index}
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
