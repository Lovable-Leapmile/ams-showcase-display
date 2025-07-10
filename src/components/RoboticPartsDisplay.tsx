import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface Part {
  id: string;
  name: string;
  imageUrl: string;
  description?: string;
}

interface Station {
  id: string;
  name: string;
  parts: Part[];
}

const RoboticPartsDisplay = () => {
  // Sample data - in real app this would come from props or API
  const [stations, setStations] = useState<Station[]>([{
    id: 'A',
    name: 'STATION A',
    parts: [{
      id: 'a1',
      name: 'Servo Motor',
      imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1920&h=1080&fit=crop'
    }, {
      id: 'a2',
      name: 'Control Board',
      imageUrl: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1920&h=1080&fit=crop'
    }]
  }, {
    id: 'B',
    name: 'STATION B',
    parts: [{
      id: 'b1',
      name: 'Robot Arm',
      imageUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1920&h=1080&fit=crop'
    }]
  }, {
    id: 'C',
    name: 'STATION C',
    parts: [{
      id: 'c1',
      name: 'Sensor Array',
      imageUrl: 'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=1920&h=1080&fit=crop'
    }, {
      id: 'c2',
      name: 'Processing Unit',
      imageUrl: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=1920&h=1080&fit=crop'
    }, {
      id: 'c3',
      name: 'Power Module',
      imageUrl: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=1920&h=1080&fit=crop'
    }]
  }, {
    id: 'D',
    name: 'STATION D',
    parts: []
  }, {
    id: 'E',
    name: 'STATION E',
    parts: []
  }]);
  const [currentStation, setCurrentStation] = useState<string>('');
  const [currentPartIndex, setCurrentPartIndex] = useState<number>(0);
  const [displayPart, setDisplayPart] = useState<Part | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get stations that have parts
  const getStationsWithParts = () => {
    return stations.filter(station => station.parts.length > 0);
  };

  // Initialize display with first available part
  useEffect(() => {
    const stationsWithParts = getStationsWithParts();
    if (stationsWithParts.length > 0) {
      const firstStation = stationsWithParts[0];
      setCurrentStation(firstStation.id);
      setCurrentPartIndex(0);
      setDisplayPart(firstStation.parts[0]);
    }
    setIsLoading(false);
  }, []);

  // Automatic cycling logic
  useEffect(() => {
    if (isLoading) return;
    const stationsWithParts = getStationsWithParts();
    if (stationsWithParts.length === 0) {
      setDisplayPart(null);
      setCurrentStation('');
      return;
    }
    const interval = setInterval(() => {
      const currentStationObj = stationsWithParts.find(s => s.id === currentStation);
      if (!currentStationObj) {
        // Current station no longer has parts, move to first available
        const firstAvailable = stationsWithParts[0];
        setCurrentStation(firstAvailable.id);
        setCurrentPartIndex(0);
        setDisplayPart(firstAvailable.parts[0]);
        return;
      }

      // Check if current station has more parts to show
      if (currentPartIndex + 1 < currentStationObj.parts.length) {
        // Show next part in current station
        const nextPartIndex = currentPartIndex + 1;
        setCurrentPartIndex(nextPartIndex);
        setDisplayPart(currentStationObj.parts[nextPartIndex]);
      } else {
        // Move to next station with parts
        const currentStationIndex = stationsWithParts.findIndex(s => s.id === currentStation);
        const nextStationIndex = (currentStationIndex + 1) % stationsWithParts.length;
        const nextStation = stationsWithParts[nextStationIndex];
        setCurrentStation(nextStation.id);
        setCurrentPartIndex(0);
        setDisplayPart(nextStation.parts[0]);
      }
    }, 5000); // 5 seconds

    return () => clearInterval(interval);
  }, [currentStation, currentPartIndex, stations, isLoading]);

  if (isLoading) {
    return <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-2xl">Initializing Display System...</div>
      </div>;
  }

  return <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col overflow-hidden">
      {/* Main Display Area - 80% height */}
      <div className="h-[80%] flex items-center justify-center p-6">
        <div className="relative w-full h-full max-w-7xl">
          {/* TV Frame */}
          <div className="bg-slate-700 p-6 rounded-2xl shadow-2xl border-4 border-slate-600 h-full">
            {/* Screen */}
            <div className="bg-slate-200 rounded-lg overflow-hidden relative h-full w-full">
              {displayPart ? <>
                  <img src={displayPart.imageUrl} alt={displayPart.name} className="w-full h-full object-fill transition-opacity duration-500" />
                  <div className="absolute inset-0" />
                  <div className="absolute bottom-6 left-6 text-white">
                    <h2 className="text-3xl xl:text-4xl font-bold mb-2">{displayPart.name}</h2>
                    <p className="text-lg xl:text-xl opacity-90">Currently displaying at {stations.find(s => s.id === currentStation)?.name}</p>
                  </div>
                </> : <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center text-slate-600">
                    <div className="text-6xl xl:text-7xl font-bold mb-4">NO PARTS</div>
                    <div className="text-2xl xl:text-3xl">Waiting for parts to be loaded...</div>
                  </div>
                </div>}
            </div>
          </div>
        </div>
      </div>

      {/* Station Indicators - 20% height */}
      <div className="h-[20%] p-6 flex flex-col justify-center">
        <div className="w-full">
          <div className="flex justify-between items-center space-x-4">
            {stations.map(station => <div key={station.id} className={cn("flex flex-col items-center space-y-2 transition-all duration-300 flex-1", currentStation === station.id ? "scale-110" : "scale-100")}>
                {/* Station Indicator */}
                <div className={cn("w-16 h-16 xl:w-20 xl:h-20 rounded-lg flex items-center justify-center text-2xl xl:text-3xl font-bold transition-all duration-300 border-2", currentStation === station.id ? "bg-teal-600 text-white border-teal-400 shadow-lg shadow-teal-500/50" : station.parts.length > 0 ? "bg-slate-600 text-white border-slate-500 hover:bg-slate-500" : "bg-slate-800 text-slate-500 border-slate-700")}>
                  {station.id}
                </div>
                
                {/* Parts Count Indicator */}
                <div className="text-center">
                  <div className={cn("text-sm xl:text-base font-medium", currentStation === station.id ? "text-teal-400" : station.parts.length > 0 ? "text-slate-300" : "text-slate-600")}>
                    {station.parts.length} {station.parts.length === 1 ? 'part' : 'parts'}
                  </div>
                </div>
              </div>)}
          </div>

          {/* Progress Indicators */}
          {displayPart && <div className="mt-4 flex justify-center">
              <div className="flex space-x-2">
                {stations.find(s => s.id === currentStation)?.parts.map((_, index) => <div key={index} className={cn("w-3 h-3 rounded-full transition-all duration-300", index === currentPartIndex ? "bg-teal-400 shadow-lg shadow-teal-400/50" : "bg-slate-600")} />)}
              </div>
            </div>}
        </div>
      </div>
    </div>;
};

export default RoboticPartsDisplay;
