import React, { useState, useEffect, useCallback, useRef } from 'react';
import StationCarousel from './StationCarousel';
import PartsDisplay from './PartsDisplay';
import PartsIndicator from './PartsIndicator';
import NoTraysScreen from './NoTraysScreen';
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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const previousStationsRef = useRef<Station[]>([]);
  const AUTH_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhY2wiOiJhZG1pbiIsImV4cCI6MTkwNzIyMTMyOX0.yl2G3oNWNgXXyCyCLnj8IW0VZ2TezllqSdnhSyLg9NQ";
  const fetchStations = async () => {
    try {
      console.log('Fetching stations data...');
      const response = await fetch('https://amsshowcase1.leapmile.com/showcase/slots?tags=station&order_by_field=id&order_by_type=ASC', {
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
      const response = await fetch(`https://amsshowcase1.leapmile.com/showcase/items?tray_id=${trayId}&order_by_field=updated_at&order_by_type=ASC`, {
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
  const getStationsWithTray = useCallback(() => {
    return stations.filter(station => station.tray_id);
  }, [stations]);

  // Detect when new trays are added and auto-navigate
  const handleStationChange = useCallback((newStationIndex: number) => {
    setIsTransitioning(true);
    setCurrentStationIndex(newStationIndex);
    setCurrentPartIndex(0);
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  }, []);

  // Auto-navigate to stations with new trays
  useEffect(() => {
    const currentStationsWithTray = getStationsWithTray();
    const previousStationsWithTray = previousStationsRef.current.filter(station => station.tray_id);
    
    // Check for new trays added
    const newTrayStations = currentStationsWithTray.filter(current => 
      !previousStationsWithTray.some(prev => prev.id === current.id && prev.tray_id === current.tray_id)
    );
    
    if (newTrayStations.length > 0 && !isLoading) {
      // Auto-navigate to the first station with a new tray
      const newStationIndex = currentStationsWithTray.findIndex(s => s.id === newTrayStations[0].id);
      if (newStationIndex !== -1) {
        console.log(`Auto-navigating to station with new tray: ${newTrayStations[0].name}`);
        handleStationChange(newStationIndex);
      }
    }
    
    // Update previous stations reference
    previousStationsRef.current = [...stations];
  }, [stations, getStationsWithTray, isLoading, handleStationChange]);
  // Handle parts display and cycling for current station
  useEffect(() => {
    if (isLoading || showErrorScreen) return;
    
    const stationsWithTray = getStationsWithTray();
    if (stationsWithTray.length === 0) {
      setDisplayPart(null);
      return;
    }

    const validStationIndex = currentStationIndex >= stationsWithTray.length ? 0 : currentStationIndex;
    const currentStation = stationsWithTray[validStationIndex];
    
    if (!currentStation || !currentStation.tray_id) return;

    let intervalId: NodeJS.Timeout;

    const setupPartsDisplay = async () => {
      if (currentStation.parts.length === 0) {
        console.log(`Loading parts for station ${currentStation.name} (${currentStation.tray_id})`);
        const parts = await fetchStationItems(currentStation.tray_id!);
        
        setStations(prevStations => 
          prevStations.map(station => 
            station.id === currentStation.id ? { ...station, parts } : station
          )
        );

        if (parts.length > 0) {
          setDisplayPart(parts[0]);
          setCurrentPartIndex(0);
        }

        // Start cycling if multiple parts
        if (parts.length > 1) {
          let partIndex = 0;
          const timePerPart = Math.max(8000 / parts.length, 2000); // Minimum 2s per part
          
          intervalId = setInterval(() => {
            partIndex = (partIndex + 1) % parts.length;
            setCurrentPartIndex(partIndex);
            setDisplayPart(parts[partIndex]);
            console.log(`Cycling to part ${partIndex}: ${parts[partIndex].name}`);
          }, timePerPart);
        }
      } else {
        // Station already has parts loaded
        if (currentStation.parts.length > 0) {
          const validPartIndex = currentPartIndex >= currentStation.parts.length ? 0 : currentPartIndex;
          setDisplayPart(currentStation.parts[validPartIndex]);
          setCurrentPartIndex(validPartIndex);

          if (currentStation.parts.length > 1) {
            let partIndex = validPartIndex;
            const timePerPart = Math.max(8000 / currentStation.parts.length, 2000);
            
            intervalId = setInterval(() => {
              partIndex = (partIndex + 1) % currentStation.parts.length;
              setCurrentPartIndex(partIndex);
              setDisplayPart(currentStation.parts[partIndex]);
              console.log(`Cycling to part ${partIndex}: ${currentStation.parts[partIndex].name}`);
            }, timePerPart);
          }
        }
      }
    };

    setupPartsDisplay();

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [currentStationIndex, stations, isLoading, showErrorScreen, getStationsWithTray]);

  // Auto cycle through stations with trays (slower cycling for better UX)
  useEffect(() => {
    if (isLoading || showErrorScreen) return;
    
    const stationsWithTray = getStationsWithTray();
    if (stationsWithTray.length <= 1) return;

    console.log(`Setting up station auto-cycle with ${stationsWithTray.length} stations`);
    
    const stationInterval = setInterval(() => {
      setCurrentStationIndex(prev => {
        const currentStationsWithTray = getStationsWithTray();
        if (currentStationsWithTray.length === 0) return 0;
        
        const nextIndex = (prev + 1) % currentStationsWithTray.length;
        setCurrentPartIndex(0);
        console.log(`Auto-switched to station ${nextIndex}: ${currentStationsWithTray[nextIndex]?.name}`);
        return nextIndex;
      });
    }, 15000); // Increased to 15 seconds for better viewing time

    return () => {
      console.log('Clearing station auto-cycle interval');
      clearInterval(stationInterval);
    };
  }, [stations, isLoading, showErrorScreen, getStationsWithTray]);
  if (isLoading) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-2xl xl:text-3xl animate-pulse">Loading stations...</div>
      </div>
    );
  }

  if (showErrorScreen) {
    return (
      <div className="h-screen flex flex-col items-center justify-center" style={{ backgroundColor: '#DBEAEA' }}>
        <img 
          src="https://ams-bucket.blr1.cdn.digitaloceanspaces.com/LOGO_AMS.png" 
          alt="AMS Logo" 
          className="mb-6 max-w-xs xl:max-w-md max-h-48 xl:max-h-64 object-contain" 
        />
        <p className="text-gray-700 text-lg xl:text-xl">Network Error or No data found</p>
      </div>
    );
  }

  const stationsWithTray = getStationsWithTray();
  const currentStation = stationsWithTray[currentStationIndex];

  // Show enhanced no trays screen when no stations have trays
  if (stationsWithTray.length === 0) {
    return <NoTraysScreen />;
  }
  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col overflow-hidden">
      {/* Parts Display Area */}
      <PartsDisplay
        parts={currentStation?.parts || []}
        currentPartIndex={currentPartIndex}
        isLoading={isTransitioning}
      />

      {/* Bottom Section with Parts Indicator and Station Carousel */}
      <div className="h-[20%] p-4 xl:p-6 flex flex-col justify-center">
        <div className="w-full space-y-4 xl:space-y-6">
          {/* Parts Indicator */}
          <PartsIndicator
            totalParts={currentStation?.parts?.length || 0}
            currentPartIndex={currentPartIndex}
            hasTray={!!currentStation?.tray_id}
          />

          {/* Station Carousel */}
          <StationCarousel
            stations={stations}
            currentStationIndex={currentStationIndex}
            onStationChange={handleStationChange}
          />
        </div>
      </div>
    </div>
  );
};
export default RoboticPartsDisplay;