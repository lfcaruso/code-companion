import { useState, useEffect, useCallback, useRef } from 'react';
import { Relay, TemperatureReading, EnergyData, Alert, MarineParameters, ParameterReading } from '@/types/aquarium';
import { esp32Api, ESP32SensorData } from '@/services/esp32Api';
import { toast } from 'sonner';

// Relays 0 and 1 have fixed names (Aquecedor and Resfriamento - controlled by temperature)
const RELAY_DEFAULTS: Relay[] = [
  { id: 0, name: 'Aquecedor', state: false, autoMode: true, timerEnabled: false, timerOnHour: 0, timerOnMinute: 0, timerOffHour: 0, timerOffMinute: 0, icon: 'thermometer', isFixed: true },
  { id: 1, name: 'Resfriamento', state: false, autoMode: true, timerEnabled: false, timerOnHour: 0, timerOnMinute: 0, timerOffHour: 0, timerOffMinute: 0, icon: 'snowflake', isFixed: true },
  { id: 2, name: 'Iluminação', state: true, autoMode: true, timerEnabled: true, timerOnHour: 8, timerOnMinute: 0, timerOffHour: 20, timerOffMinute: 0, icon: 'sun' },
  { id: 3, name: 'Bomba Principal', state: true, autoMode: false, timerEnabled: false, timerOnHour: 0, timerOnMinute: 0, timerOffHour: 0, timerOffMinute: 0, icon: 'waves' },
  { id: 4, name: 'Skimmer', state: true, autoMode: false, timerEnabled: false, timerOnHour: 0, timerOnMinute: 0, timerOffHour: 0, timerOffMinute: 0, icon: 'wind' },
  { id: 5, name: 'Bomba Dosadora', state: false, autoMode: true, timerEnabled: true, timerOnHour: 10, timerOnMinute: 0, timerOffHour: 10, timerOffMinute: 5, icon: 'droplets' },
  { id: 6, name: 'UV', state: true, autoMode: false, timerEnabled: false, timerOnHour: 0, timerOnMinute: 0, timerOffHour: 0, timerOffMinute: 0, icon: 'zap' },
  { id: 7, name: 'Wavemaker', state: true, autoMode: false, timerEnabled: false, timerOnHour: 0, timerOnMinute: 0, timerOffHour: 0, timerOffMinute: 0, icon: 'waves' },
  { id: 8, name: 'Alimentador', state: false, autoMode: true, timerEnabled: true, timerOnHour: 9, timerOnMinute: 0, timerOffHour: 9, timerOffMinute: 5, icon: 'utensils' },
  { id: 9, name: 'Relé 10', state: false, autoMode: false, timerEnabled: false, timerOnHour: 0, timerOnMinute: 0, timerOffHour: 0, timerOffMinute: 0, icon: 'power' },
];

const RELAY_ICONS: Record<number, string> = {
  0: 'thermometer',
  1: 'snowflake',
  2: 'sun',
  3: 'waves',
  4: 'wind',
  5: 'droplets',
  6: 'zap',
  7: 'waves',
  8: 'utensils',
  9: 'power',
};

const generateParameterHistory = (baseValue: number, variation: number, decimals: number = 2): ParameterReading[] => {
  const history: ParameterReading[] = [];
  const now = new Date();
  for (let i = 24; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
    const fluctuation = Math.sin(i / 6) * variation + (Math.random() - 0.5) * (variation / 2);
    history.push({
      timestamp,
      value: parseFloat((baseValue + fluctuation).toFixed(decimals)),
    });
  }
  return history;
};

export function useAquariumData() {
  const [temperature, setTemperature] = useState(25.5);
  const [temperatureSetpoint, setTemperatureSetpoint] = useState(26.0);
  const [temperatureHistory, setTemperatureHistory] = useState<TemperatureReading[]>([]);
  const [relays, setRelays] = useState<Relay[]>(RELAY_DEFAULTS);
  const [energy, setEnergy] = useState<EnergyData>({
    currentWatts: 85,
    dailyKwh: 1.2,
    monthlyKwh: 32.5,
    cost: 24.80,
  });
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const lastConnectionToast = useRef<number>(0);
  
  // Marine parameters (pH and TDS are manual input)
  const [marineParams, setMarineParams] = useState<MarineParameters>({
    ph: 8.2,
    phHistory: [],
    salinity: 1.025, // SG (Specific Gravity)
    salinityHistory: [],
    tds: 180,
    tdsHistory: [],
  });

  // Initialize history data
  useEffect(() => {
    const tempHistory = generateParameterHistory(25.5, 0.5, 1);
    setTemperatureHistory(tempHistory);
    
    setMarineParams({
      ph: 8.2,
      phHistory: generateParameterHistory(8.2, 0.15, 2),
      salinity: 1.025,
      salinityHistory: generateParameterHistory(1.025, 0.002, 3),
      tds: 180,
      tdsHistory: generateParameterHistory(180, 20, 0),
    });
  }, []);

  // Process ESP32 data and update state
  const processESP32Data = useCallback((data: ESP32SensorData) => {
    const now = new Date();
    
    // Update temperature
    setTemperature(data.temperature);
    setTemperatureSetpoint(data.temperatureSetpoint);
    setTemperatureHistory(prev => {
      const newHistory = [...prev, { timestamp: now, value: data.temperature }];
      return newHistory.slice(-25);
    });

    // Update salinity from ESP32 (pH and TDS are manual input)
    setMarineParams(prev => ({
      ...prev,
      salinity: data.salinity,
      salinityHistory: [...prev.salinityHistory, { timestamp: now, value: data.salinity }].slice(-25),
    }));

    // Update relays from ESP32 data
    if (data.relays && data.relays.length > 0) {
      setRelays(prev => prev.map((relay, index) => {
        const espRelay = data.relays.find(r => r.id === index);
        if (espRelay) {
          return {
            ...relay,
            state: espRelay.state,
            autoMode: espRelay.autoMode,
            timerEnabled: espRelay.timerEnabled,
            timerOnHour: espRelay.timerOnHour ?? relay.timerOnHour,
            timerOnMinute: espRelay.timerOnMinute ?? relay.timerOnMinute,
            timerOffHour: espRelay.timerOffHour ?? relay.timerOffHour,
            timerOffMinute: espRelay.timerOffMinute ?? relay.timerOffMinute,
          };
        }
        return relay;
      }));
    }

    // Update energy data
    if (data.energy) {
      setEnergy(data.energy);
    }
  }, []);

  // Fetch data from ESP32
  const fetchFromESP32 = useCallback(async () => {
    const response = await esp32Api.fetchSensorData();
    const now = Date.now();
    
    if (response.success && response.data) {
      if (!isConnected) {
        setIsConnected(true);
        setConnectionError(null);
        if (now - lastConnectionToast.current > 10000) {
          toast.success('Conectado à ESP32!');
          lastConnectionToast.current = now;
        }
      }
      processESP32Data(response.data);
    } else {
      if (isConnected) {
        setIsConnected(false);
        setConnectionError(response.error || 'Erro de conexão');
        if (now - lastConnectionToast.current > 10000) {
          toast.error('Conexão com ESP32 perdida', {
            description: 'Usando dados simulados...'
          });
          lastConnectionToast.current = now;
        }
      }
      // Fall back to simulated data
      simulateData();
    }
  }, [isConnected, processESP32Data]);

  // Simulate data when ESP32 is not connected
  const simulateData = useCallback(() => {
    const now = new Date();
    
    // Temperature simulation
    setTemperature(prev => {
      const variation = (Math.random() - 0.5) * 0.2;
      return parseFloat((prev + variation).toFixed(1));
    });
    
    setTemperatureHistory(prev => {
      const newHistory = [...prev, { timestamp: now, value: temperature }];
      return newHistory.slice(-25);
    });

    // Salinity simulation only (pH and TDS are manual input)
    setMarineParams(prev => {
      const newSalinity = parseFloat((prev.salinity + (Math.random() - 0.5) * 0.001).toFixed(3));
      
      return {
        ...prev,
        salinity: Math.max(1.020, Math.min(1.030, newSalinity)),
        salinityHistory: [...prev.salinityHistory, { timestamp: now, value: newSalinity }].slice(-25),
      };
    });

    // Energy simulation
    setEnergy(prev => ({
      ...prev,
      currentWatts: Math.floor(75 + Math.random() * 30),
    }));
  }, [temperature]);

  // Poll ESP32 for data
  useEffect(() => {
    // Initial fetch
    fetchFromESP32();
    
    // Poll every 3 seconds
    const interval = setInterval(fetchFromESP32, 3000);
    return () => clearInterval(interval);
  }, [fetchFromESP32]);

  const toggleRelay = useCallback(async (id: number) => {
    const relay = relays.find(r => r.id === id);
    if (!relay) return;

    const newState = !relay.state;
    
    // Optimistic update
    setRelays(prev => prev.map(r =>
      r.id === id ? { ...r, state: newState } : r
    ));

    // Send to ESP32
    const response = await esp32Api.setRelayState(id, newState);
    if (!response.success) {
      // Revert on failure
      setRelays(prev => prev.map(r =>
        r.id === id ? { ...r, state: !newState } : r
      ));
      toast.error('Erro ao alterar relé', {
        description: response.error
      });
    }
  }, [relays]);

  const updateRelay = useCallback(async (id: number, updates: Partial<Relay>) => {
    // Optimistic update
    setRelays(prev => prev.map(relay =>
      relay.id === id ? { ...relay, ...updates } : relay
    ));

    // If timer settings changed, send to ESP32
    if ('timerEnabled' in updates || 'timerOnHour' in updates) {
      const relay = relays.find(r => r.id === id);
      if (relay) {
        const response = await esp32Api.setRelayTimer(
          id,
          updates.timerEnabled ?? relay.timerEnabled,
          updates.timerOnHour ?? relay.timerOnHour,
          updates.timerOnMinute ?? relay.timerOnMinute,
          updates.timerOffHour ?? relay.timerOffHour,
          updates.timerOffMinute ?? relay.timerOffMinute
        );
        
        if (!response.success) {
          toast.error('Erro ao configurar timer', {
            description: response.error
          });
        }
      }
    }
  }, [relays]);

  const refreshConnection = useCallback(() => {
    fetchFromESP32();
  }, [fetchFromESP32]);

  const addAlert = useCallback((type: Alert['type'], message: string) => {
    const newAlert: Alert = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date(),
    };
    setAlerts(prev => [newAlert, ...prev].slice(0, 10));
  }, []);

  const dismissAlert = useCallback((id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  }, []);

  // Update manual parameters (pH and TDS)
  const updateManualParams = useCallback((ph: number, tds: number) => {
    const now = new Date();
    setMarineParams(prev => ({
      ...prev,
      ph,
      phHistory: [...prev.phHistory, { timestamp: now, value: ph }].slice(-25),
      tds,
      tdsHistory: [...prev.tdsHistory, { timestamp: now, value: tds }].slice(-25),
    }));
  }, []);

  return {
    temperature,
    temperatureSetpoint,
    setTemperatureSetpoint,
    temperatureHistory,
    relays,
    toggleRelay,
    updateRelay,
    energy,
    alerts,
    addAlert,
    dismissAlert,
    marineParams,
    updateManualParams,
    isConnected,
    connectionError,
    refreshConnection,
  };
}
