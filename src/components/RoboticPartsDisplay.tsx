import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import amsLogo from '@/assets/ams-logo.png';
import appLinkImage from '@/assets/applink.png';
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
  item_id: string;
  item_description: string;
  display_image: string;
  updated_at: string;
  tray_id: string;
}
interface ItemsApiResponse {
  status: string;
  records: ApiItem[];
  count: number;
  total_count: number;
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
      const transformedStations: Station[] = apiResponse.records.map(station => ({
        id: station.id.toString(),
        name: station.slot_name,
        tray_id: station.tray_id,
        parts: []
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
      const parts: Part[] = itemsResponse.records.map(item => ({
        id: item.id.toString(),
        name: item.item_id,
        imageUrl: item.display_image,
        description: item.item_description
      }));
      return parts;
    } catch (err) {
      console.error(`Error fetching items for tray ${trayId}:`, err);
      return [];
    }
  };
  useEffect(() => {
    fetchStations();
    const pollInterval = setInterval(() => {
      fetchStations();
    }, 3000);
    return () => clearInterval(pollInterval);
  }, []);
  const getStationsWithTray = () => {
    return stations.filter(station => station.tray_id);
  };
  // Effect to refresh parts for current station every 3 seconds
  useEffect(() => {
    if (isLoading || showErrorScreen) return;
    const stationsWithTray = getStationsWithTray();
    if (stationsWithTray.length === 0) return;
    
    const validStationIndex = currentStationIndex >= stationsWithTray.length ? 0 : currentStationIndex;
    const currentStation = stationsWithTray[validStationIndex];
    if (!currentStation || !currentStation.tray_id) return;

    const refreshParts = async () => {
      console.log(`Refreshing parts for station ${currentStation.name} (${currentStation.tray_id})`);
      const parts = await fetchStationItems(currentStation.tray_id!);
      setStations(prevStations => prevStations.map(station => 
        station.id === currentStation.id ? { ...station, parts } : station
      ));
    };

    // Initial load
    refreshParts();

    // Refresh parts every 3 seconds
    const refreshInterval = setInterval(refreshParts, 3000);

    return () => clearInterval(refreshInterval);
  }, [currentStationIndex, isLoading, showErrorScreen]);

  // Effect to handle part cycling within current station
  useEffect(() => {
    if (isLoading || showErrorScreen) return;
    const stationsWithTray = getStationsWithTray();
    if (stationsWithTray.length === 0) {
      setDisplayPart(null);
      return;
    }

    const validStationIndex = currentStationIndex >= stationsWithTray.length ? 0 : currentStationIndex;
    const currentStation = stationsWithTray[validStationIndex];
    if (!currentStation || !currentStation.tray_id || currentStation.parts.length === 0) {
      setDisplayPart(null);
      return;
    }

    const validPartIndex = currentPartIndex >= currentStation.parts.length ? 0 : currentPartIndex;
    setDisplayPart(currentStation.parts[validPartIndex]);
    setCurrentPartIndex(validPartIndex);

    if (currentStation.parts.length <= 1) return;

    let partIndex = validPartIndex;
    const timePerPart = 10000 / currentStation.parts.length;
    
    const cycleInterval = setInterval(() => {
      partIndex = (partIndex + 1) % currentStation.parts.length;
      setCurrentPartIndex(partIndex);
      setDisplayPart(currentStation.parts[partIndex]);
      console.log(`Cycling to part ${partIndex}: ${currentStation.parts[partIndex].name}`);
    }, timePerPart);

    return () => clearInterval(cycleInterval);
  }, [currentStationIndex, stations, currentPartIndex]);
  useEffect(() => {
    if (isLoading || showErrorScreen) return;
    const stationsWithTray = getStationsWithTray();
    if (stationsWithTray.length <= 1) return;
    
    console.log(`Setting up station carousel with ${stationsWithTray.length} stations`);
    const stationInterval = setInterval(() => {
      console.log(`Switching from station ${currentStationIndex} to next station`);
      setCurrentStationIndex(prev => {
        const nextIndex = (prev + 1) % stationsWithTray.length;
        setCurrentPartIndex(0);
        console.log(`Switched to station ${nextIndex}: ${stationsWithTray[nextIndex]?.name}`);
        return nextIndex;
      });
    }, 10000);
    return () => {
      console.log('Clearing station interval');
      clearInterval(stationInterval);
    };
  }, [stations.length, isLoading, showErrorScreen]);
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

  // Show no trays screen when no stations have trays
  if (stationsWithTray.length === 0) {
    return <div className="h-screen flex flex-col items-center justify-center" style={{
      backgroundColor: '#E5F0F0'
    }}>
        <img src={amsLogo} alt="AMS Logo" className="mb-6 max-w-xs max-h-48 object-contain" />
        <div className="text-center text-gray-700 text-sm max-w-md px-4">
          <p>No trays are in Stations Retrieve Tray from App</p>
          <img src={appLinkImage} alt="App Link" className="inline-block mx-2 w-32 h-32 object-contain pt-4 " />
          
        </div>
      </div>;
  }
  return <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col overflow-hidden">
      <div className="h-[80%] flex items-center justify-center p-6">
        <div className="relative w-full h-full">
          <div className="bg-slate-700 p-0 shadow-2xl border-4 border-slate-600 h-full rounded-3xl">
            <div className="rounded-3xl overflow-hidden relative h-full w-full bg-white">
              {displayPart ? <>
                  <img src={displayPart.imageUrl} alt={displayPart.name} className="w-full h-full object-fill mx-auto transition-opacity duration-500" />
                  
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

      <div className="h-[20%] p-6 flex flex-col justify-center">
        <div className="w-full">
         {currentStation?.tray_id && <div className="mb-4 flex justify-center">
    <div className="flex space-x-2">
      {(currentStation.parts.length > 0 ? currentStation.parts : Array.from({
              length: currentPartIndex + 1
            }) // fallback to show same dot count
            ).map((_, index) => <div key={index} className={cn("w-3 h-3 rounded-full transition-all duration-300", index === currentPartIndex ? "bg-teal-400 shadow-lg shadow-teal-400/50" : "bg-slate-400")} />)}
    </div>
  </div>}
          <div className="flex justify-center items-center w-full">
            <div className="flex justify-evenly items-center w-full max-w-full">
              {stations.map((station, index) => <div key={station.id} className={cn("flex flex-col items-center space-y-2 transition-all duration-300 flex-1", stationsWithTray[currentStationIndex]?.id === station.id ? "scale-110" : "scale-100")}>
                  <div className={cn("w-16 h-16 xl:w-20 xl:h-20 rounded-lg flex items-center justify-center text-2xl xl:text-3xl font-bold transition-all duration-300 border-2", stationsWithTray[currentStationIndex]?.id === station.id ? "bg-teal-600 text-white border-teal-400 shadow-lg shadow-teal-500/50" : station.tray_id ? "bg-slate-600 text-white border-slate-500 hover:bg-slate-500" : "bg-slate-800 text-slate-500 border-slate-700 opacity-50")}>
                    {station.name}
                  </div>

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