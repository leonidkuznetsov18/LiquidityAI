import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { InfoIcon } from "lucide-react";

interface Props {
  explanation: string;
  rangeLow: number;
  rangeHigh: number;
}

export default function PredictionExplanationDialog({ explanation, rangeLow, rangeHigh }: Props) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <InfoIcon className="h-4 w-4" />
          Explain Prediction
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Prediction Explanation</DialogTitle>
          <DialogDescription>
            Range: ${rangeLow.toFixed(2)} - ${rangeHigh.toFixed(2)}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {explanation}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
