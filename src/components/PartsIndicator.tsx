import React from 'react';
import { cn } from '@/lib/utils';

interface PartsIndicatorProps {
  totalParts: number;
  currentPartIndex: number;
  hasTray: boolean;
}

const PartsIndicator: React.FC<PartsIndicatorProps> = ({
  totalParts,
  currentPartIndex,
  hasTray
}) => {
  if (!hasTray || totalParts <= 1) return null;

  return (
    <div className="mb-6 flex justify-center">
      <div className="flex space-x-3">
        {Array.from({ length: totalParts }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "w-4 h-4 xl:w-5 xl:h-5 rounded-full transition-all duration-500 ease-in-out",
              index === currentPartIndex
                ? "bg-teal-400 shadow-lg shadow-teal-400/50 scale-125"
                : "bg-slate-400 hover:bg-slate-300"
            )}
          />
        ))}
      </div>
    </div>
  );
};

export default PartsIndicator;