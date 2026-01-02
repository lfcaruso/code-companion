import { useState, useEffect, useCallback } from 'react';
import { Relay, TemperatureReading, EnergyData, Alert, MarineParameters, ParameterReading } from '@/types/aquarium';

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
  
  // Marine parameters
  const [marineParams, setMarineParams] = useState<MarineParameters>({
    ph: 8.2,
    phHistory: [],
    salinity: 35.0,
    salinityHistory: [],
    orp: 380,
    orpHistory: [],
  });

  // Initialize history data
  useEffect(() => {
    const tempHistory = generateParameterHistory(25.5, 0.5, 1);
    setTemperatureHistory(tempHistory);
    
    setMarineParams({
      ph: 8.2,
      phHistory: generateParameterHistory(8.2, 0.15, 2),
      salinity: 35.0,
      salinityHistory: generateParameterHistory(35.0, 0.5, 1),
      orp: 380,
      orpHistory: generateParameterHistory(380, 20, 0),
    });
  }, []);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Temperature
      const tempVariation = (Math.random() - 0.5) * 0.2;
      const newTemp = parseFloat((temperature + tempVariation).toFixed(1));
      setTemperature(newTemp);
      
      setTemperatureHistory(prev => {
        const newHistory = [...prev, { timestamp: new Date(), value: newTemp }];
        return newHistory.slice(-25);
      });

      // Marine parameters
      setMarineParams(prev => {
        const newPh = parseFloat((prev.ph + (Math.random() - 0.5) * 0.05).toFixed(2));
        const newSalinity = parseFloat((prev.salinity + (Math.random() - 0.5) * 0.2).toFixed(1));
        const newOrp = Math.round(prev.orp + (Math.random() - 0.5) * 10);
        
        return {
          ph: Math.max(7.8, Math.min(8.6, newPh)),
          phHistory: [...prev.phHistory, { timestamp: new Date(), value: newPh }].slice(-25),
          salinity: Math.max(33, Math.min(37, newSalinity)),
          salinityHistory: [...prev.salinityHistory, { timestamp: new Date(), value: newSalinity }].slice(-25),
          orp: Math.max(300, Math.min(450, newOrp)),
          orpHistory: [...prev.orpHistory, { timestamp: new Date(), value: newOrp }].slice(-25),
        };
      });

      // Random energy fluctuation
      setEnergy(prev => ({
        ...prev,
        currentWatts: Math.floor(75 + Math.random() * 30),
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, [temperature]);

  const toggleRelay = useCallback((id: number) => {
    setRelays(prev => prev.map(relay =>
      relay.id === id ? { ...relay, state: !relay.state } : relay
    ));
  }, []);

  const updateRelay = useCallback((id: number, updates: Partial<Relay>) => {
    setRelays(prev => prev.map(relay =>
      relay.id === id ? { ...relay, ...updates } : relay
    ));
  }, []);

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
  };
}
