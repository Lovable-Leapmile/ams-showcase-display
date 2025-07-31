import React from 'react';
import { cn } from '@/lib/utils';

interface Part {
  id: string;
  name: string;
  imageUrl: string;
  description?: string;
}

interface PartsDisplayProps {
  parts: Part[];
  currentPartIndex: number;
  isLoading?: boolean;
}

const PartsDisplay: React.FC<PartsDisplayProps> = ({
  parts,
  currentPartIndex,
  isLoading = false
}) => {
  const currentPart = parts[currentPartIndex];

  return (
    <div className="h-[80%] flex items-center justify-center p-6">
      <div className="relative w-full h-full">
        <div className="bg-slate-700 p-0 shadow-2xl border-4 border-slate-600 h-full rounded-3xl transition-all duration-300">
          <div className="rounded-3xl overflow-hidden relative h-full w-full bg-white">
            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center bg-white">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-600"></div>
              </div>
            ) : currentPart ? (
              <div className="w-full h-full relative overflow-hidden">
                <img
                  src={currentPart.imageUrl}
                  alt={currentPart.name}
                  className="w-full h-full object-cover transition-all duration-700 ease-in-out transform hover:scale-105"
                  onLoad={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                  onError={(e) => {
                    e.currentTarget.style.opacity = '0.5';
                  }}
                  style={{ opacity: 0 }}
                />
                
                {/* Part Name Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <div className="text-white font-semibold text-lg xl:text-xl">
                    {currentPart.name}
                  </div>
                  {currentPart.description && (
                    <div className="text-white/90 text-sm xl:text-base mt-1">
                      {currentPart.description}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-white">
                <div className="text-slate-400 text-xl xl:text-2xl">No parts available</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartsDisplay;