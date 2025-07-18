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

  const AUTH_TOKEN = "YOUR_TOKEN_HERE";

  const fetchStations = async () => {
    try {
      const response = await fetch('https://dev.qikpod.com/showcase/slots?tags=station&order_by_field=id&order_by_type=ASC', {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const apiResponse: ApiResponse = await response.json();
      const transformedStations: Station[] = apiResponse.records.map(station => ({
        id: station.id.toString(),
        name: station.slot_name,
        tray_id: station.tray_id,
        parts: []
      }));
      setStations(transformedStations);
      setError(null);
      setShowErrorScreen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stations');
      setShowErrorScreen(true);
      setStations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStationItems = async (trayId: string): Promise<Part[]> => {
    try {
      const response = await fetch(`https://dev.qikpod.com/showcase/items?tray_id=${trayId}&order_by_field=updated_at&order_by_type=ASC`, {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const itemsResponse: ItemsApiResponse = await response.json();
      return itemsResponse.records.map(item => ({
        id: item.id.toString(),
        name: item.item_id,
        imageUrl: item.display_image,
        description: item.item_description
      }));
    } catch (err) {
      console.error(`Error fetching items for tray ${trayId}:`, err);
      return [];
    }
  };

  useEffect(() => {
    fetchStations();
    const pollInterval = setInterval(fetchStations, 3000);
    return () => clearInterval(pollInterval);
  }, []);

  const getStationsWithTray = () => stations.filter(station => station.tray_id);

  useEffect(() => {
    if (isLoading || showErrorScreen) return;
    const stationsWithTray = getStationsWithTray();
    if (!stationsWithTray.length) return setDisplayPart(null);

    const validStationIndex = currentStationIndex >= stationsWithTray.length ? 0 : currentStationIndex;
    const currentStation = stationsWithTray[validStationIndex];
    if (!currentStation || !currentStation.tray_id) return;

    let intervalId: NodeJS.Timeout;

    const setupCarousel = async () => {
      if (!currentStation.parts.length) {
        const parts = await fetchStationItems(currentStation.tray_id!);
        setStations(prev => prev.map(station => station.id === currentStation.id ? { ...station, parts } : station));
        if (parts.length > 0) {
          setDisplayPart(parts[0]);
          setCurrentPartIndex(0);
          if (parts.length > 1) {
            let partIndex = 0;
            const timePerPart = 10000 / parts.length;
            intervalId = setInterval(() => {
              partIndex = (partIndex + 1) % parts.length;
              setCurrentPartIndex(partIndex);
              setDisplayPart(parts[partIndex]);
            }, timePerPart);
          }
        }
      } else {
        const validPartIndex = currentPartIndex >= currentStation.parts.length ? 0 : currentPartIndex;
        setDisplayPart(currentStation.parts[validPartIndex]);
        setCurrentPartIndex(validPartIndex);
        if (currentStation.parts.length > 1) {
          let partIndex = validPartIndex;
          const timePerPart = 10000 / currentStation.parts.length;
          intervalId = setInterval(() => {
            partIndex = (partIndex + 1) % currentStation.parts.length;
            setCurrentPartIndex(partIndex);
            setDisplayPart(currentStation.parts[partIndex]);
          }, timePerPart);
        }
      }
    };

    setupCarousel();
    return () => clearInterval(intervalId);
  }, [currentStationIndex, stations.length, isLoading, showErrorScreen]);

  useEffect(() => {
    if (isLoading || showErrorScreen) return;
    const stationsWithTray = getStationsWithTray();
    if (stationsWithTray.length <= 1) return;
    const stationInterval = setInterval(() => {
      setCurrentStationIndex(prev => {
        const nextIndex = (prev + 1) % stationsWithTray.length;
        setCurrentPartIndex(0);
        return nextIndex;
      });
    }, 10000);
    return () => clearInterval(stationInterval);
  }, [stations.length, isLoading, showErrorScreen, currentStationIndex]);

  const stationsWithTray = getStationsWithTray();
  const currentStation = stationsWithTray[currentStationIndex];

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center bg-slate-900 text-white text-2xl">Loading stations...</div>;
  }

  if (showErrorScreen) {
    return <div className="h-screen flex flex-col items-center justify-center bg-[#DBEAEA]">
      <img src={amsLogo} alt="AMS Logo" className="mb-6 max-w-xs max-h-48 object-contain" />
      <p className="text-gray-700 text-lg">Network Error or No data found</p>
    </div>;
  }

  if (!stationsWithTray.length) {
    return <div className="h-screen flex flex-col items-center justify-center bg-[#E5F0F0]">
      <img src={amsLogo} alt="AMS Logo" className="mb-6 max-w-xs max-h-48 object-contain" />
      <p className="text-center text-gray-700 text-sm max-w-md px-4">No trays are in Stations. Retrieve Tray from App</p>
      <img src={appLinkImage} alt="App Link" className="w-32 h-32 object-contain pt-4" />
    </div>;
  }

  return <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col overflow-hidden">
    <div className="h-[80%] flex items-center justify-center p-6">
      <div className="relative w-full h-full">
        <div className="bg-slate-700 p-6 rounded-2xl shadow-2xl border-4 border-slate-600 h-full">
          <div className="rounded-lg overflow-hidden relative h-full w-full bg-white">
            {displayPart ? <img src={displayPart.imageUrl} alt={displayPart.name} className="w-full h-full object-fill mx-auto transition-opacity duration-500" /> :
              <div className="w-full h-full flex items-center justify-center text-slate-600">
                <div className="text-center">
                  <div className="text-6xl font-bold mb-4">NO PARTS</div>
                  <div className="text-2xl">Waiting for parts to be loaded...</div>
                </div>
              </div>}
          </div>
        </div>
      </div>
    </div>

    <div className="h-[20%] p-6 flex flex-col justify-center">
      <div className="w-full">
        {currentStation?.tray_id && (
          <div className="mb-4 flex justify-center">
            <div className="flex space-x-2">
              {(currentStation.parts.length > 0 ? currentStation.parts : Array(1).fill(null)).map((_, index) => (
                <div key={index} className={cn(
                  "w-3 h-3 rounded-full transition-all duration-300",
                  index === currentPartIndex && currentStation.parts.length > 0
                    ? "bg-teal-400 shadow-lg shadow-teal-400/50"
                    : "bg-slate-400"
                )} />
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-center items-center w-full">
          <div className="flex justify-evenly items-center w-full max-w-full">
            {stations.map((station, index) => (
              <div key={station.id} className={cn(
                "flex flex-col items-center space-y-2 transition-all duration-300 flex-1",
                stationsWithTray[currentStationIndex]?.id === station.id ? "scale-110" : "scale-100"
              )}>
                <div className={cn(
                  "w-16 h-16 xl:w-20 xl:h-20 rounded-lg flex items-center justify-center text-2xl font-bold border-2 transition-all",
                  stationsWithTray[currentStationIndex]?.id === station.id
                    ? "bg-teal-600 text-white border-teal-400 shadow-lg shadow-teal-500/50"
                    : station.tray_id
                      ? "bg-slate-600 text-white border-slate-500 hover:bg-slate-500"
                      : "bg-slate-800 text-slate-500 border-slate-700 opacity-50"
                )}>
                  {station.name}
                </div>
                <div className={cn("text-sm font-medium text-center", station.tray_id ? "text-slate-300" : "text-slate-600")}>{station.tray_id || "No Tray"}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>;
};

export default RoboticPartsDisplay;