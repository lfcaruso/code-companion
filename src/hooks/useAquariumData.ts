import { useState, useEffect, useCallback, useRef } from 'react';
import { Relay, TemperatureReading, EnergyData, Alert, MarineParameters, ParameterReading } from '@/types/aquarium';
import { esp32Api, ESP32SensorData, ManualParametersData, ParametersHistoryEntry } from '@/services/esp32Api';
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
  const [temperatureSetpoint, setTemperatureSetpointState] = useState(26.0);
  const [temperatureHysteresis, setTemperatureHysteresis] = useState(0.5);
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
  const pendingSetpoint = useRef<number | null>(null);
  
  // Marine parameters - all are manual input (pH, Salinidade, TDS, KH, Cálcio, Magnésio, Nitrato, Fosfato)
  const [marineParams, setMarineParams] = useState<MarineParameters>({
    ph: 8.2,
    phHistory: [],
    salinity: 1.025, // SG (Specific Gravity)
    salinityHistory: [],
    tds: 180,
    tdsHistory: [],
    kh: 8.0,
    khHistory: [],
    calcium: 420,
    calciumHistory: [],
    magnesium: 1350,
    magnesiumHistory: [],
    nitrate: 5,
    nitrateHistory: [],
    phosphate: 0.03,
    phosphateHistory: [],
  });

  // Load saved parameters from SD card on mount
  useEffect(() => {
    const loadSavedData = async () => {
      // First, load current parameters from SD card
      const paramsResponse = await esp32Api.fetchManualParameters();
      if (paramsResponse.success && paramsResponse.data) {
        const data = paramsResponse.data;
        setMarineParams(prev => ({
          ...prev,
          ph: data.ph ?? prev.ph,
          salinity: data.salinity ?? prev.salinity,
          tds: data.tds ?? prev.tds,
          kh: data.kh ?? prev.kh,
          calcium: data.calcium ?? prev.calcium,
          magnesium: data.magnesium ?? prev.magnesium,
          nitrate: data.nitrate ?? prev.nitrate,
          phosphate: data.phosphate ?? prev.phosphate,
        }));
      }

      // Then, load history from SD card (30 days)
      const historyResponse = await esp32Api.fetchParametersHistory();
      if (historyResponse.success && historyResponse.data) {
        const entries = historyResponse.data.entries || [];
        
        // Convert history entries to ParameterReading format
        const phHistory: ParameterReading[] = [];
        const salinityHistory: ParameterReading[] = [];
        const tdsHistory: ParameterReading[] = [];
        const khHistory: ParameterReading[] = [];
        const calciumHistory: ParameterReading[] = [];
        const magnesiumHistory: ParameterReading[] = [];
        const nitrateHistory: ParameterReading[] = [];
        const phosphateHistory: ParameterReading[] = [];

        entries.forEach(entry => {
          const timestamp = new Date(entry.timestamp);
          if (entry.ph !== undefined) phHistory.push({ timestamp, value: entry.ph });
          if (entry.salinity !== undefined) salinityHistory.push({ timestamp, value: entry.salinity });
          if (entry.tds !== undefined) tdsHistory.push({ timestamp, value: entry.tds });
          if (entry.kh !== undefined) khHistory.push({ timestamp, value: entry.kh });
          if (entry.calcium !== undefined) calciumHistory.push({ timestamp, value: entry.calcium });
          if (entry.magnesium !== undefined) magnesiumHistory.push({ timestamp, value: entry.magnesium });
          if (entry.nitrate !== undefined) nitrateHistory.push({ timestamp, value: entry.nitrate });
          if (entry.phosphate !== undefined) phosphateHistory.push({ timestamp, value: entry.phosphate });
        });

        setMarineParams(prev => ({
          ...prev,
          phHistory: phHistory.length > 0 ? phHistory : prev.phHistory,
          salinityHistory: salinityHistory.length > 0 ? salinityHistory : prev.salinityHistory,
          tdsHistory: tdsHistory.length > 0 ? tdsHistory : prev.tdsHistory,
          khHistory: khHistory.length > 0 ? khHistory : prev.khHistory,
          calciumHistory: calciumHistory.length > 0 ? calciumHistory : prev.calciumHistory,
          magnesiumHistory: magnesiumHistory.length > 0 ? magnesiumHistory : prev.magnesiumHistory,
          nitrateHistory: nitrateHistory.length > 0 ? nitrateHistory : prev.nitrateHistory,
          phosphateHistory: phosphateHistory.length > 0 ? phosphateHistory : prev.phosphateHistory,
        }));

        console.log(`📊 Carregado histórico de parâmetros: ${entries.length} registros`);
      } else {
        // If no saved data, initialize with simulated history for demo
        const tempHistory = generateParameterHistory(25.5, 0.5, 1);
        setTemperatureHistory(tempHistory);
        
        setMarineParams({
          ph: 8.2,
          phHistory: generateParameterHistory(8.2, 0.15, 2),
          salinity: 1.025,
          salinityHistory: generateParameterHistory(1.025, 0.002, 3),
          tds: 180,
          tdsHistory: generateParameterHistory(180, 20, 0),
          kh: 8.0,
          khHistory: generateParameterHistory(8.0, 0.5, 1),
          calcium: 420,
          calciumHistory: generateParameterHistory(420, 20, 0),
          magnesium: 1350,
          magnesiumHistory: generateParameterHistory(1350, 50, 0),
          nitrate: 5,
          nitrateHistory: generateParameterHistory(5, 2, 1),
          phosphate: 0.03,
          phosphateHistory: generateParameterHistory(0.03, 0.01, 2),
        });
      }
    };

    loadSavedData();

    // Cleanup old history entries periodically (every hour)
    const cleanupInterval = setInterval(() => {
      esp32Api.cleanupParametersHistory().then(response => {
        if (response.success && response.data && response.data.deletedCount > 0) {
          console.log(`🧹 Limpeza de histórico: ${response.data.deletedCount} registros antigos removidos`);
        }
      });
    }, 60 * 60 * 1000); // Every hour

    return () => clearInterval(cleanupInterval);
  }, []);

  // Process ESP32 data and update state
  const processESP32Data = useCallback((data: ESP32SensorData) => {
    const now = new Date();
    
    // Update temperature
    setTemperature(data.temperature);
    setTemperatureSetpointState(data.temperatureSetpoint);
    setTemperatureHistory(prev => {
      const newHistory = [...prev, { timestamp: now, value: data.temperature }];
      return newHistory.slice(-25);
    });

    // Note: All marine parameters (pH, Salinity, TDS, KH, etc.) are manual input now

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
    
    // Temperature simulation only - all marine parameters are manual input
    setTemperature(prev => {
      const variation = (Math.random() - 0.5) * 0.2;
      return parseFloat((prev + variation).toFixed(1));
    });
    
    setTemperatureHistory(prev => {
      const newHistory = [...prev, { timestamp: now, value: temperature }];
      return newHistory.slice(-25);
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

  // Update manual parameters (pH, Salinidade, TDS, KH, Cálcio, Magnésio, Nitrato, Fosfato)
  // And save to SD card for 30-day history
  const updateManualParams = useCallback(async (params: {
    ph?: number;
    salinity?: number;
    tds?: number;
    kh?: number;
    calcium?: number;
    magnesium?: number;
    nitrate?: number;
    phosphate?: number;
  }) => {
    const now = new Date();
    const timestamp = now.toISOString();
    
    // Update local state
    setMarineParams(prev => {
      const updated = { ...prev };
      
      if (params.ph !== undefined) {
        updated.ph = params.ph;
        updated.phHistory = [...prev.phHistory, { timestamp: now, value: params.ph }].slice(-720); // ~30 days with hourly readings
      }
      if (params.salinity !== undefined) {
        updated.salinity = params.salinity;
        updated.salinityHistory = [...prev.salinityHistory, { timestamp: now, value: params.salinity }].slice(-720);
      }
      if (params.tds !== undefined) {
        updated.tds = params.tds;
        updated.tdsHistory = [...prev.tdsHistory, { timestamp: now, value: params.tds }].slice(-720);
      }
      if (params.kh !== undefined) {
        updated.kh = params.kh;
        updated.khHistory = [...prev.khHistory, { timestamp: now, value: params.kh }].slice(-720);
      }
      if (params.calcium !== undefined) {
        updated.calcium = params.calcium;
        updated.calciumHistory = [...prev.calciumHistory, { timestamp: now, value: params.calcium }].slice(-720);
      }
      if (params.magnesium !== undefined) {
        updated.magnesium = params.magnesium;
        updated.magnesiumHistory = [...prev.magnesiumHistory, { timestamp: now, value: params.magnesium }].slice(-720);
      }
      if (params.nitrate !== undefined) {
        updated.nitrate = params.nitrate;
        updated.nitrateHistory = [...prev.nitrateHistory, { timestamp: now, value: params.nitrate }].slice(-720);
      }
      if (params.phosphate !== undefined) {
        updated.phosphate = params.phosphate;
        updated.phosphateHistory = [...prev.phosphateHistory, { timestamp: now, value: params.phosphate }].slice(-720);
      }
      
      return updated;
    });

    // Save current values to SD card
    const currentParams: ManualParametersData = {
      ph: params.ph ?? marineParams.ph,
      salinity: params.salinity ?? marineParams.salinity,
      tds: params.tds ?? marineParams.tds,
      kh: params.kh ?? marineParams.kh,
      calcium: params.calcium ?? marineParams.calcium,
      magnesium: params.magnesium ?? marineParams.magnesium,
      nitrate: params.nitrate ?? marineParams.nitrate,
      phosphate: params.phosphate ?? marineParams.phosphate,
      lastUpdated: timestamp,
    };

    const saveParamsResponse = await esp32Api.saveManualParameters(currentParams);
    
    // Save history entry to SD card
    const historyEntry: ParametersHistoryEntry = {
      timestamp,
      ...params,
    };

    const saveHistoryResponse = await esp32Api.saveParametersHistoryEntry(historyEntry);

    if (saveParamsResponse.success && saveHistoryResponse.success) {
      toast.success('Parâmetros salvos no SD card', {
        description: 'Histórico atualizado com sucesso'
      });
    } else if (!saveParamsResponse.success || !saveHistoryResponse.success) {
      // Still saved locally, just notify about SD card issue
      console.warn('⚠️ Parâmetros salvos localmente, mas falha ao salvar no SD card');
    }
  }, [marineParams]);

  // Update temperature setpoint and send to ESP32
  const setTemperatureSetpoint = useCallback(async (newSetpoint: number) => {
    // Update local state immediately
    setTemperatureSetpointState(newSetpoint);
    pendingSetpoint.current = newSetpoint;

    // Send to ESP32
    const response = await esp32Api.setTemperatureSetpoint(newSetpoint);
    
    if (response.success) {
      toast.success('Setpoint atualizado', {
        description: `Temperatura alvo: ${newSetpoint.toFixed(1)}°C`
      });
    } else {
      toast.error('Erro ao atualizar setpoint', {
        description: response.error
      });
    }
    
    pendingSetpoint.current = null;
  }, []);

  return {
    temperature,
    temperatureSetpoint,
    setTemperatureSetpoint,
    temperatureHysteresis,
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
