import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
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

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Liquidity Range</h2>

      <div className="space-y-8">
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm text-muted-foreground">Lower Bound</label>
              <Input
                type="number"
                value={range[0]}
                onChange={(e) => setRange([+e.target.value, range[1]])}
              />
            </div>
            <div className="flex-1">
              <label className="text-sm text-muted-foreground">Upper Bound</label>
              <Input
                type="number"
                value={range[1]}
                onChange={(e) => setRange([range[0], +e.target.value])}
              />
            </div>
          </div>

          <Slider
            value={range}
            min={1500}
            max={2500}
            step={1}
            onValueChange={(value) => setRange(value as [number, number])}
          />
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
