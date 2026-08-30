"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = Number.MAX_SAFE_INTEGER,
  className,
}: QuantityStepperProps) {
  const decrement = () => onChange(Math.max(min, value - 1));
  const increment = () => onChange(Math.min(max, value + 1));

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <button
        type="button"
        onClick={decrement}
        disabled={value <= min}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#dde4ec] text-teal transition-colors hover:border-teal hover:bg-teal-light disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Decrease quantity"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="min-w-8 text-center text-base font-bold text-navy">
        {value}
      </span>
      <button
        type="button"
        onClick={increment}
        disabled={value >= max}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#dde4ec] text-teal transition-colors hover:border-teal hover:bg-teal-light disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Increase quantity"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
