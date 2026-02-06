'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

interface RangeSliderProps {
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  formatValue?: (value: number) => string;
  label: string;
  accentColor?: string;
}

export function RangeSlider({
  min,
  max,
  step = 1,
  value,
  onChange,
  label,
  accentColor = 'purple'
}: RangeSliderProps) {
  const [localMin, setLocalMin] = useState(value[0].toString());
  const [localMax, setLocalMax] = useState(value[1].toString());
  const rangeRef = useRef<HTMLDivElement>(null);
  
  // Sync local state with props
  useEffect(() => {
    setLocalMin(value[0].toString());
    setLocalMax(value[1].toString());
  }, [value]);

  const getPercent = useCallback(
    (val: number) => Math.round(((val - min) / (max - min)) * 100),
    [min, max]
  );

  const handleMinSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = Math.min(Number(e.target.value), value[1] - step);
    onChange([newMin, value[1]]);
  };

  const handleMaxSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = Math.max(Number(e.target.value), value[0] + step);
    onChange([value[0], newMax]);
  };

  const handleMinInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalMin(e.target.value);
  };

  const handleMaxInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalMax(e.target.value);
  };

  const commitMinInput = () => {
    let newMin = parseInt(localMin) || min;
    newMin = Math.max(min, Math.min(newMin, value[1] - step));
    onChange([newMin, value[1]]);
    setLocalMin(newMin.toString());
  };

  const commitMaxInput = () => {
    let newMax = parseInt(localMax) || max;
    newMax = Math.min(max, Math.max(newMax, value[0] + step));
    onChange([value[0], newMax]);
    setLocalMax(newMax.toString());
  };

  const handleKeyDown = (e: React.KeyboardEvent, commitFn: () => void) => {
    if (e.key === 'Enter') {
      commitFn();
    }
  };

  const minPercent = getPercent(value[0]);
  const maxPercent = getPercent(value[1]);

  const colorMap: Record<string, string> = {
    purple: 'bg-purple-500',
    teal: 'bg-teal-500',
    amber: 'bg-amber-500',
    blue: 'bg-blue-500',
  };

  return (
    <div className="space-y-2">
      {/* Label */}
      <label className="text-xs text-[var(--text-secondary)] block">{label}</label>
      
      {/* Input Fields */}
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={localMin}
          onChange={handleMinInput}
          onBlur={commitMinInput}
          onKeyDown={(e) => handleKeyDown(e, commitMinInput)}
          min={min}
          max={value[1] - step}
          step={step}
          className="w-20 bg-[var(--bg-card)] border border-[var(--border)] rounded px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-purple)] text-center"
        />
        <span className="text-xs text-[var(--text-secondary)]">to</span>
        <input
          type="number"
          value={localMax}
          onChange={handleMaxInput}
          onBlur={commitMaxInput}
          onKeyDown={(e) => handleKeyDown(e, commitMaxInput)}
          min={value[0] + step}
          max={max}
          step={step}
          className="w-20 bg-[var(--bg-card)] border border-[var(--border)] rounded px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-purple)] text-center"
        />
      </div>

      {/* Dual-handle Range Slider */}
      <div ref={rangeRef} className="relative h-6 pt-2">
        {/* Track background */}
        <div className="absolute h-1.5 w-full rounded-full bg-[var(--border)] top-3" />
        
        {/* Active range highlight */}
        <div
          className={`absolute h-1.5 rounded-full ${colorMap[accentColor] || 'bg-purple-500'} top-3`}
          style={{
            left: `${minPercent}%`,
            width: `${maxPercent - minPercent}%`
          }}
        />

        {/* Min slider thumb */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[0]}
          onChange={handleMinSlider}
          className="absolute w-full h-1.5 appearance-none bg-transparent pointer-events-none top-3 z-10
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:pointer-events-auto
            [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:shadow-md
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:hover:scale-110
            [&::-webkit-slider-thumb]:transition-transform
            [&::-moz-range-thumb]:pointer-events-auto
            [&::-moz-range-thumb]:h-4
            [&::-moz-range-thumb]:w-4
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-white
            [&::-moz-range-thumb]:shadow-md
            [&::-moz-range-thumb]:cursor-pointer"
        />

        {/* Max slider thumb */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[1]}
          onChange={handleMaxSlider}
          className="absolute w-full h-1.5 appearance-none bg-transparent pointer-events-none top-3 z-10
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:pointer-events-auto
            [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:shadow-md
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:hover:scale-110
            [&::-webkit-slider-thumb]:transition-transform
            [&::-moz-range-thumb]:pointer-events-auto
            [&::-moz-range-thumb]:h-4
            [&::-moz-range-thumb]:w-4
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-white
            [&::-moz-range-thumb]:shadow-md
            [&::-moz-range-thumb]:cursor-pointer"
        />
      </div>
    </div>
  );
}
