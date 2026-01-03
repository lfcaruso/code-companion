import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from '@/types/aquarium';
import { toast } from 'sonner';

interface SystemSettings {
  tempMin: number;
  tempMax: number;
  tempSetpoint: number;
  tempHysteresis: number;
  phMin: number;
  phMax: number;
  phAlertEnabled: boolean;
  salinityMin: number;
  salinityMax: number;
  salinityAlertEnabled: boolean;
  orpMin: number;
  orpMax: number;
  orpAlertEnabled: boolean;
  refreshInterval: number;
  alertsEnabled: boolean;
  soundEnabled: boolean;
  autoModeEnabled: boolean;
}

const defaultSettings: SystemSettings = {
  tempMin: 24.0,
  tempMax: 27.0,
  tempSetpoint: 25.5,
  tempHysteresis: 0.5,
  phMin: 8.0,
  phMax: 8.4,
  phAlertEnabled: true,
  salinityMin: 32,
  salinityMax: 36,
  salinityAlertEnabled: true,
  orpMin: 300,
  orpMax: 450,
  orpAlertEnabled: true,
  refreshInterval: 3,
  alertsEnabled: true,
  soundEnabled: false,
  autoModeEnabled: true,
};

interface ParameterValues {
  temperature: number;
  ph: number;
  salinity: number;
  orp: number;
}

// Audio context for alert sounds
let audioContext: AudioContext | null = null;

const playAlertSound = (type: 'warning' | 'error' | 'info') => {
  try {
    if (!audioContext) {
      audioContext = new AudioContext();
    }
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Different frequencies for different alert types
    const frequencies = {
      error: [880, 660, 880], // High-low-high for error
      warning: [660, 880], // Low-high for warning
      info: [440], // Single tone for info
    };
    
    const freqs = frequencies[type];
    const duration = 0.15;
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    
    freqs.forEach((freq, i) => {
      oscillator.frequency.setValueAtTime(freq, audioContext!.currentTime + i * duration);
    });
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + freqs.length * duration);
    
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + freqs.length * duration);
  } catch (e) {
    console.log('Audio not supported');
  }
};

export function useAlerts(params: ParameterValues) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const lastAlertTime = useRef<Record<string, number>>({});
  const ALERT_COOLDOWN = 30000; // 30 seconds between same alerts

  // Load settings
  useEffect(() => {
    const saved = localStorage.getItem('aquarium-settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
    
    // Listen for settings changes
    const handleStorageChange = () => {
      const updated = localStorage.getItem('aquarium-settings');
      if (updated) {
        setSettings(JSON.parse(updated));
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also poll for changes (for same-tab updates)
    const interval = setInterval(() => {
      const updated = localStorage.getItem('aquarium-settings');
      if (updated) {
        const parsed = JSON.parse(updated);
        setSettings(prev => {
          if (JSON.stringify(prev) !== JSON.stringify(parsed)) {
            return parsed;
          }
          return prev;
        });
      }
    }, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const addAlert = useCallback((type: Alert['type'], message: string, key: string) => {
    const now = Date.now();
    
    // Check cooldown
    if (lastAlertTime.current[key] && now - lastAlertTime.current[key] < ALERT_COOLDOWN) {
      return;
    }
    
    lastAlertTime.current[key] = now;
    
    const newAlert: Alert = {
      id: `${key}-${now}`,
      type,
      message,
      timestamp: new Date(),
    };
    
    setAlerts(prev => {
      // Remove duplicate alerts with same key prefix
      const filtered = prev.filter(a => !a.id.startsWith(key));
      return [newAlert, ...filtered].slice(0, 20);
    });
    
    // Show toast notification
    if (settings.alertsEnabled) {
      if (type === 'error') {
        toast.error(message);
      } else if (type === 'warning') {
        toast.warning(message);
      } else {
        toast.info(message);
      }
    }
    
    // Play sound
    if (settings.soundEnabled) {
      playAlertSound(type);
    }
  }, [settings.alertsEnabled, settings.soundEnabled]);

  const dismissAlert = useCallback((id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  }, []);

  const clearAllAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  // Check parameters against limits
  useEffect(() => {
    if (!settings.alertsEnabled) return;

    const { temperature, ph, salinity, orp } = params;

    // Temperature checks
    if (temperature < settings.tempMin) {
      addAlert('error', `Temperatura baixa: ${temperature.toFixed(1)}°C (mín: ${settings.tempMin}°C)`, 'temp-low');
    } else if (temperature > settings.tempMax) {
      addAlert('error', `Temperatura alta: ${temperature.toFixed(1)}°C (máx: ${settings.tempMax}°C)`, 'temp-high');
    }

    // pH checks
    if (settings.phAlertEnabled) {
      if (ph < settings.phMin) {
        addAlert('warning', `pH baixo: ${ph.toFixed(2)} (mín: ${settings.phMin})`, 'ph-low');
      } else if (ph > settings.phMax) {
        addAlert('warning', `pH alto: ${ph.toFixed(2)} (máx: ${settings.phMax})`, 'ph-high');
      }
    }

    // Salinity checks
    if (settings.salinityAlertEnabled) {
      if (salinity < settings.salinityMin) {
        addAlert('warning', `Salinidade baixa: ${salinity.toFixed(1)} ppt (mín: ${settings.salinityMin} ppt)`, 'sal-low');
      } else if (salinity > settings.salinityMax) {
        addAlert('warning', `Salinidade alta: ${salinity.toFixed(1)} ppt (máx: ${settings.salinityMax} ppt)`, 'sal-high');
      }
    }

    // ORP checks
    if (settings.orpAlertEnabled) {
      if (orp < settings.orpMin) {
        addAlert('info', `ORP baixo: ${orp} mV (mín: ${settings.orpMin} mV)`, 'orp-low');
      } else if (orp > settings.orpMax) {
        addAlert('info', `ORP alto: ${orp} mV (máx: ${settings.orpMax} mV)`, 'orp-high');
      }
    }
  }, [params, settings, addAlert]);

  return {
    alerts,
    addAlert: (type: Alert['type'], message: string) => addAlert(type, message, `manual-${Date.now()}`),
    dismissAlert,
    clearAllAlerts,
    settings,
  };
}
