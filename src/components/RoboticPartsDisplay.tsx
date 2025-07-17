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
  tray_id: string | null;
  parts: Part[];
}

interface ApiStation {
  id: number;
  slot_name: string;
  tray_id: string | null;
  // Add other fields as needed based on API response
}

interface ApiResponse {
  status: string;
  records: ApiStation[];
  count: number;
  statusbool: boolean;
  ok: boolean;
}

const RoboticPartsDisplay = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [currentStation, setCurrentStation] = useState<string>('');
  const [currentPartIndex, setCurrentPartIndex] = useState<number>(0);
  const [displayPart, setDisplayPart] = useState<Part | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const AUTH_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhY2wiOiJhZG1pbiIsImV4cCI6MTkwNzIyMTMyOX0.yl2G3oNWNgXXyCyCLnj8IW0VZ2TezllqSdnhSyLg9NQ";

  // Fetch stations from API
  useEffect(() => {
    const fetchStations = async () => {
      try {
        const response = await fetch('https://dev.qikpod.com/showcase/slots?tags=station&order_by_field=id&order_by_type=ASC', {
          headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const apiResponse: ApiResponse = await response.json();
        console.log('Fetched API response:', apiResponse);

        // Transform API data to match our Station interface
        const transformedStations: Station[] = apiResponse.records.map(station => ({
          id: station.id.toString(),
          name: station.slot_name,
          tray_id: station.tray_id,
          parts: station.tray_id ? [{
            id: `${station.id}-part`,
            name: `Part from ${station.slot_name}`,
            imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1920&h=1080&fit=crop'
          }] : []
        }));

        console.log('Transformed stations:', transformedStations);
        setStations(transformedStations);
        setError(null);
      } catch (err) {
        console.error('Error fetching stations:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch stations');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStations();
  }, []);

  // Get stations that have parts
  const getStationsWithParts = () => {
    return stations.filter(station => station.parts.length > 0);
  };

  // Initialize display with first available part
  useEffect(() => {
    if (isLoading) return;
    
    const stationsWithParts = getStationsWithParts();
    if (stationsWithParts.length > 0) {
      const firstStation = stationsWithParts[0];
      setCurrentStation(firstStation.id);
      setCurrentPartIndex(0);
      setDisplayPart(firstStation.parts[0]);
    }
  }, [stations, isLoading]);

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
    return (
      <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading stations...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-red-400 text-2xl">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col overflow-hidden">
      {/* Main Display Area - 80% height */}
      <div className="h-[80%] flex items-center justify-center p-6">
        <div className="relative w-full h-full">
          {/* TV Frame */}
          <div className="bg-slate-700 p-6 rounded-2xl shadow-2xl border-4 border-slate-600 h-full">
            {/* Screen */}
            <div className="rounded-lg overflow-hidden relative h-full w-full bg-white">
              {displayPart ? (
                <>
                  <img 
                    src={displayPart.imageUrl} 
                    alt={displayPart.name} 
                    className="w-full h-full object-fill transition-opacity duration-500" 
                  />
                  <div className="absolute inset-0" />
                  <div className="absolute bottom-6 left-6 text-white">
                    <h2 className="text-3xl xl:text-4xl font-bold mb-2">{displayPart.name}</h2>
                    <p className="text-lg xl:text-xl opacity-90">
                      Currently displaying at {stations.find(s => s.id === currentStation)?.name}
                    </p>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center text-slate-600">
                    <div className="text-6xl xl:text-7xl font-bold mb-4">NO PARTS</div>
                    <div className="text-2xl xl:text-3xl">Waiting for parts to be loaded...</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Station Indicators - 20% height */}
      <div className="h-[20%] p-6 flex flex-col justify-center">
        <div className="w-full">
          {/* Progress Indicators */}
          {displayPart && (
            <div className="mb-4 flex justify-center">
              <div className="flex space-x-2">
                {stations.find(s => s.id === currentStation)?.parts.map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "w-3 h-3 rounded-full transition-all duration-300",
                      index === currentPartIndex
                        ? "bg-teal-400 shadow-lg shadow-teal-400/50"
                        : "bg-slate-600"
                    )}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-center items-center w-full">
            <div className="flex justify-evenly items-center w-full max-w-full">
              {stations.map((station) => (
                <div
                  key={station.id}
                  className={cn(
                    "flex flex-col items-center space-y-2 transition-all duration-300 flex-1",
                    currentStation === station.id ? "scale-110" : "scale-100"
                  )}
                >
                  {/* Station Indicator */}
                  <div
                    className={cn(
                      "w-16 h-16 xl:w-20 xl:h-20 rounded-lg flex items-center justify-center text-2xl xl:text-3xl font-bold transition-all duration-300 border-2",
                      currentStation === station.id
                        ? "bg-teal-600 text-white border-teal-400 shadow-lg shadow-teal-500/50"
                        : station.tray_id
                        ? "bg-slate-600 text-white border-slate-500 hover:bg-slate-500"
                        : "bg-slate-800 text-slate-500 border-slate-700 opacity-50"
                    )}
                  >
                    {station.name}
                  </div>

                  {/* Tray ID Display */}
                  <div className="text-center">
                    <div
                      className={cn(
                        "text-sm xl:text-base font-medium",
                        currentStation === station.id
                          ? "text-teal-400"
                          : station.tray_id
                          ? "text-slate-300"
                          : "text-slate-600"
                      )}
                    >
                      {station.tray_id || "No Tray"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoboticPartsDisplay;
