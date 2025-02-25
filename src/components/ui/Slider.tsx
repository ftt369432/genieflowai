import React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';

interface SliderProps {
  value: number[];
  onValueChange: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export function Slider({ value, onValueChange, min = 0, max = 100, step = 1, className = '' }: SliderProps) {
  return (
    <SliderPrimitive.Root
      className={`relative flex items-center w-full h-5 ${className}`}
      value={value}
      onValueChange={onValueChange}
      min={min}
      max={max}
      step={step}
    >
      <SliderPrimitive.Track className="relative h-1 w-full grow rounded-full bg-white/10">
        <SliderPrimitive.Range className="absolute h-full rounded-full bg-purple-500" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        className="block w-4 h-4 bg-white rounded-full shadow-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
      />
    </SliderPrimitive.Root>
  );
} 