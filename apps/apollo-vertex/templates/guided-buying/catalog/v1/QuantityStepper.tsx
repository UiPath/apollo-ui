import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
}

/** Controlled −/+ quantity stepper, shared by the detail overlay and cart. */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
}: QuantityStepperProps) {
  return (
    <div className="flex items-center rounded-lg border">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Decrease quantity"
      >
        <Minus className="size-4" />
      </Button>
      <span className="w-8 text-center text-sm font-medium tabular-nums">
        {value}
      </span>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => onChange(value + 1)}
        aria-label="Increase quantity"
      >
        <Plus className="size-4" />
      </Button>
    </div>
  );
}
