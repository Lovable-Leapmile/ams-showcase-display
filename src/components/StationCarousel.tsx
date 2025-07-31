import React from 'react';
import { cn } from '@/lib/utils';

interface Station {
  id: string;
  name: string;
  tray_id: string | null;
  parts: Array<{
    id: string;
    name: string;
    imageUrl: string;
    description?: string;
  }>;
}

interface StationCarouselProps {
  stations: Station[];
  currentStationIndex: number;
  onStationChange: (index: number) => void;
}

const StationCarousel: React.FC<StationCarouselProps> = ({
  stations,
  currentStationIndex,
  onStationChange
}) => {
  const stationsWithTray = stations.filter(station => station.tray_id);
  const currentStation = stationsWithTray[currentStationIndex];

  return (
    <div className="flex justify-center items-center w-full">
      <div className="flex justify-evenly items-center w-full max-w-full">
        {stations.map((station, index) => {
          const isCurrentActive = currentStation?.id === station.id;
          const hasActiveTray = station.tray_id !== null;
          
          return (
            <div
              key={station.id}
              className={cn(
                "flex flex-col items-center space-y-3 transition-all duration-500 ease-in-out flex-1 cursor-pointer",
                isCurrentActive ? "scale-110 transform" : "scale-100"
              )}
              onClick={() => {
                if (hasActiveTray) {
                  const stationWithTrayIndex = stationsWithTray.findIndex(s => s.id === station.id);
                  if (stationWithTrayIndex !== -1) {
                    onStationChange(stationWithTrayIndex);
                  }
                }
              }}
            >
              {/* Station Container - More Rectangular */}
              <div
                className={cn(
                  "w-20 h-12 xl:w-28 xl:h-16 rounded-xl flex items-center justify-center text-lg xl:text-2xl font-bold transition-all duration-500 border-2 shadow-lg",
                  isCurrentActive
                    ? "bg-teal-600 text-white border-teal-400 shadow-teal-500/50 animate-pulse"
                    : hasActiveTray
                    ? "bg-slate-600 text-white border-slate-500 hover:bg-slate-500 hover:scale-105"
                    : "bg-slate-800 text-slate-500 border-slate-700 opacity-50"
                )}
              >
                {station.name}
              </div>

              {/* Tray ID Display */}
              <div className="text-center">
                <div
                  className={cn(
                    "text-sm xl:text-base font-medium transition-colors duration-300",
                    isCurrentActive
                      ? "text-teal-400"
                      : hasActiveTray
                      ? "text-slate-300"
                      : "text-slate-600"
                  )}
                >
                  {station.tray_id || "No Tray"}
                </div>
              </div>

              {/* Active Station Indicator */}
              {isCurrentActive && (
                <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse shadow-lg shadow-teal-400/50" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StationCarousel;