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
}
interface ApiResponse {
  status: string;
  records: ApiStation[];
  count: number;
  statusbool: boolean;
  ok: boolean;
}
interface ApiItem {
  id: number;
  item_name: string;
  display_image: string;
  updated_at: string;
}
interface ItemsApiResponse {
  status: string;
  records: ApiItem[];
  count: number;
  statusbool: boolean;
  ok: boolean;
}
const RoboticPartsDisplay = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [currentStationIndex, setCurrentStationIndex] = useState<number>(0);
  const [currentPartIndex, setCurrentPartIndex] = useState<number>(0);
  const [displayPart, setDisplayPart] = useState<Part | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showErrorScreen, setShowErrorScreen] = useState(false);
  const AUTH_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhY2wiOiJhZG1pbiIsImV4cCI6MTkwNzIyMTMyOX0.yl2G3oNWNgXXyCyCLnj8IW0VZ2TezllqSdnhSyLg9NQ";
  const fetchStations = async () => {
    try {
      console.log('Fetching stations data...');
      const response = await fetch('https://dev.qikpod.com/showcase/slots?tags=station&order_by_field=id&order_by_type=ASC', {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const apiResponse: ApiResponse = await response.json();
      console.log('Fetched API response:', apiResponse);

      // Transform API data to match our Station interface (without parts initially)
      const transformedStations: Station[] = apiResponse.records.map(station => ({
        id: station.id.toString(),
        name: station.slot_name,
        tray_id: station.tray_id,
        parts: [] // Will be populated when station becomes active
      }));
      console.log('Transformed stations:', transformedStations);
      setStations(transformedStations);
      setError(null);
      setShowErrorScreen(false);
    } catch (err) {
      console.error('Error fetching stations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch stations');
      setShowErrorScreen(true);
      setStations([]);
    } finally {
      setIsLoading(false);
    }
  };
  const fetchStationItems = async (trayId: string): Promise<Part[]> => {
    try {
      console.log(`Fetching items for tray: ${trayId}`);
      const response = await fetch(`https://dev.qikpod.com/showcase/items?tray_id=${trayId}&order_by_field=updated_at&order_by_type=ASC`, {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const itemsResponse: ItemsApiResponse = await response.json();
      console.log(`Fetched items for ${trayId}:`, itemsResponse);

      // Transform items to parts
      const parts: Part[] = itemsResponse.records.map(item => ({
        id: item.id.toString(),
        name: item.item_name,
        imageUrl: item.display_image,
        description: `Updated: ${item.updated_at}`
      }));
      return parts;
    } catch (err) {
      console.error(`Error fetching items for tray ${trayId}:`, err);
      return [];
    }
  };

  // Initial fetch and setup polling every 3 seconds for stations
  useEffect(() => {
    fetchStations();
    const pollInterval = setInterval(() => {
      fetchStations();
    }, 3000);
    return () => clearInterval(pollInterval);
  }, []);

  // Get stations that have tray_id
  const getStationsWithTray = () => {
    return stations.filter(station => station.tray_id);
  };

  // Station sliding logic - changes every 10 seconds
  useEffect(() => {
    if (isLoading || showErrorScreen) return;
    const stationsWithTray = getStationsWithTray();
    if (stationsWithTray.length === 0) {
      setDisplayPart(null);
      return;
    }

    // Initialize with first station
    if (currentStationIndex >= stationsWithTray.length) {
      setCurrentStationIndex(0);
    }
    const interval = setInterval(() => {
      setCurrentStationIndex(prev => {
        const nextIndex = (prev + 1) % stationsWithTray.length;
        setCurrentPartIndex(0); // Reset part index when changing stations
        return nextIndex;
      });
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [stations, isLoading, showErrorScreen, currentStationIndex]);

  // Fetch items for current active station and handle part cycling
  useEffect(() => {
    if (isLoading || showErrorScreen) return;
    const stationsWithTray = getStationsWithTray();
    if (stationsWithTray.length === 0) return;
    const currentStation = stationsWithTray[currentStationIndex];
    if (!currentStation || !currentStation.tray_id) return;

    // Fetch items for current station
    const fetchAndSetItems = async () => {
      const parts = await fetchStationItems(currentStation.tray_id!);

      // Update the station with its parts
      setStations(prevStations => prevStations.map(station => station.id === currentStation.id ? {
        ...station,
        parts
      } : station));

      // Set initial display part
      if (parts.length > 0) {
        setDisplayPart(parts[0]);
      }
    };
    fetchAndSetItems();
  }, [currentStationIndex, stations.length, isLoading, showErrorScreen]);

  // Handle part cycling within current station
  useEffect(() => {
    if (isLoading || showErrorScreen) return;
    const stationsWithTray = getStationsWithTray();
    if (stationsWithTray.length === 0) return;
    const currentStation = stationsWithTray[currentStationIndex];
    if (!currentStation || currentStation.parts.length === 0) return;
    const partCount = currentStation.parts.length;
    if (partCount <= 1) {
      // If only one part or no parts, just display it
      if (partCount === 1) {
        setDisplayPart(currentStation.parts[0]);
      }
      return;
    }

    // Calculate time per part: 10 seconds divided by number of parts
    const timePerPart = 10000 / partCount;
    const interval = setInterval(() => {
      setCurrentPartIndex(prev => {
        const nextIndex = (prev + 1) % partCount;
        setDisplayPart(currentStation.parts[nextIndex]);
        return nextIndex;
      });
    }, timePerPart);
    return () => clearInterval(interval);
  }, [currentStationIndex, stations, currentPartIndex, isLoading, showErrorScreen]);
  if (isLoading) {
    return <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading stations...</div>
      </div>;
  }
  if (showErrorScreen) {
    return <div className="h-screen flex flex-col items-center justify-center" style={{
      backgroundColor: '#DBEAEA'
    }}>
        <img src="https://ams-bucket.blr1.cdn.digitaloceanspaces.com/LOGO_AMS.png" alt="AMS Logo" className="mb-6 max-w-xs max-h-48 object-contain" />
        <p className="text-gray-700 text-lg">Network Error or No data found</p>
      </div>;
  }
  const stationsWithTray = getStationsWithTray();
  const currentStation = stationsWithTray[currentStationIndex];
  return <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col overflow-hidden">
      {/* Main Display Area - 80% height */}
      <div className="h-[80%] flex items-center justify-center p-6">
        <div className="relative w-full h-full">
          {/* TV Frame */}
          <div className="bg-slate-700 p-6 rounded-2xl shadow-2xl border-4 border-slate-600 h-full">
            {/* Screen */}
            <div className="rounded-lg overflow-hidden relative h-full w-full bg-white">
              {displayPart ? <>
                  <img src={displayPart.imageUrl} alt={displayPart.name} className="w-[100%] h-full object-fit mx-auto transition-opacity duration-500" />
                  <div className="absolute bottom-6 left-6 text-white">
                    <h2 className="text-3xl xl:text-4xl font-bold mb-2">{displayPart.name}</h2>
                    
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
          {/* Progress Indicators */}
          {displayPart && currentStation && currentStation.parts.length > 1 && <div className="mb-4 flex justify-center">
              <div className="flex space-x-2">
                {currentStation.parts.map((_, index) => <div key={index} className={cn("w-3 h-3 rounded-full transition-all duration-300", index === currentPartIndex ? "bg-teal-400 shadow-lg shadow-teal-400/50" : "bg-slate-600")} />)}
              </div>
            </div>}

          <div className="flex justify-center items-center w-full">
            <div className="flex justify-evenly items-center w-full max-w-full">
              {stations.map((station, index) => <div key={station.id} className={cn("flex flex-col items-center space-y-2 transition-all duration-300 flex-1", stationsWithTray[currentStationIndex]?.id === station.id ? "scale-110" : "scale-100")}>
                  {/* Station Indicator */}
                  <div className={cn("w-16 h-16 xl:w-20 xl:h-20 rounded-lg flex items-center justify-center text-2xl xl:text-3xl font-bold transition-all duration-300 border-2", stationsWithTray[currentStationIndex]?.id === station.id ? "bg-teal-600 text-white border-teal-400 shadow-lg shadow-teal-500/50" : station.tray_id ? "bg-slate-600 text-white border-slate-500 hover:bg-slate-500" : "bg-slate-800 text-slate-500 border-slate-700 opacity-50")}>
                    {station.name}
                  </div>

                  {/* Tray ID Display */}
                  <div className="text-center">
                    <div className={cn("text-sm xl:text-base font-medium", stationsWithTray[currentStationIndex]?.id === station.id ? "text-teal-400" : station.tray_id ? "text-slate-300" : "text-slate-600")}>
                      {station.tray_id || "No Tray"}
                    </div>
                  </div>
                </div>)}
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default RoboticPartsDisplay;