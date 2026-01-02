import { useState, useEffect, useCallback } from 'react';
import { Relay, TemperatureReading, EnergyData, Alert } from '@/types/aquarium';

const RELAY_DEFAULTS: Relay[] = [
  { id: 0, name: 'Iluminação', state: true, autoMode: true, timerEnabled: true, timerOnHour: 8, timerOnMinute: 0, timerOffHour: 20, timerOffMinute: 0, icon: 'sun' },
  { id: 1, name: 'Filtro', state: true, autoMode: false, timerEnabled: false, timerOnHour: 0, timerOnMinute: 0, timerOffHour: 0, timerOffMinute: 0, icon: 'waves' },
  { id: 2, name: 'Aquecedor', state: false, autoMode: true, timerEnabled: false, timerOnHour: 0, timerOnMinute: 0, timerOffHour: 0, timerOffMinute: 0, icon: 'thermometer' },
  { id: 3, name: 'Bomba CO2', state: true, autoMode: true, timerEnabled: true, timerOnHour: 10, timerOnMinute: 0, timerOffHour: 18, timerOffMinute: 0, icon: 'droplets' },
  { id: 4, name: 'Aerador', state: false, autoMode: true, timerEnabled: true, timerOnHour: 20, timerOnMinute: 0, timerOffHour: 8, timerOffMinute: 0, icon: 'wind' },
  { id: 5, name: 'Alimentador', state: false, autoMode: true, timerEnabled: true, timerOnHour: 9, timerOnMinute: 0, timerOffHour: 9, timerOffMinute: 5, icon: 'utensils' },
];

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

  // Simulate temperature readings
  useEffect(() => {
    const generateHistory = () => {
      const history: TemperatureReading[] = [];
      const now = new Date();
      for (let i = 24; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
        const baseTemp = 25.5;
        const variation = Math.sin(i / 4) * 0.5 + (Math.random() - 0.5) * 0.3;
        history.push({
          timestamp,
          value: parseFloat((baseTemp + variation).toFixed(1)),
        });
      }
      return history;
    };

    setTemperatureHistory(generateHistory());

    const interval = setInterval(() => {
      const variation = (Math.random() - 0.5) * 0.2;
      const newTemp = parseFloat((temperature + variation).toFixed(1));
      setTemperature(newTemp);
      
      setTemperatureHistory(prev => {
        const newHistory = [...prev, { timestamp: new Date(), value: newTemp }];
        return newHistory.slice(-25);
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
  };
}
