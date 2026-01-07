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
  tdsMin: number;
  tdsMax: number;
  tdsAlertEnabled: boolean;
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
  salinityMin: 1.022,
  salinityMax: 1.028,
  salinityAlertEnabled: true,
  tdsMin: 100,
  tdsMax: 400,
  tdsAlertEnabled: true,
  refreshInterval: 3,
  alertsEnabled: true,
  soundEnabled: false,
  autoModeEnabled: true,
};

interface ParameterValues {
  temperature: number;
  ph: number;
  salinity: number;
  tds: number;
}

const normalizeSalinitySg = (value: unknown): number => {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return NaN;
  // Accept "1025" style input (1025 -> 1.025)
  if (num >= 1000) return num / 1000;
  return num;
};

const normalizeLoadedSettings = (raw: unknown): SystemSettings => {
  if (!raw || typeof raw !== 'object') return defaultSettings;

  const candidate = raw as Partial<SystemSettings>;

  const salinityMin = normalizeSalinitySg(candidate.salinityMin);
  const salinityMax = normalizeSalinitySg(candidate.salinityMax);

  return {
    ...defaultSettings,
    ...candidate,
    salinityMin: Number.isFinite(salinityMin) ? salinityMin : defaultSettings.salinityMin,
    salinityMax: Number.isFinite(salinityMax) ? salinityMax : defaultSettings.salinityMax,
  };
};

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
      setSettings(normalizeLoadedSettings(JSON.parse(saved)));
    }

    // Listen for settings changes
    const handleStorageChange = () => {
      const updated = localStorage.getItem('aquarium-settings');
      if (updated) {
        setSettings(normalizeLoadedSettings(JSON.parse(updated)));
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also poll for changes (for same-tab updates)
    const interval = setInterval(() => {
      const updated = localStorage.getItem('aquarium-settings');
      if (updated) {
        const parsed = normalizeLoadedSettings(JSON.parse(updated));
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

  const clearAlertsByKey = useCallback((keyPrefix: string) => {
    setAlerts(prev => prev.filter(a => !a.id.startsWith(keyPrefix)));
  }, []);

  // Check parameters against limits
  useEffect(() => {
    if (!settings.alertsEnabled) return;

    const { temperature, ph, salinity, tds } = params;

    // Temperature checks
    if (temperature < settings.tempMin) {
      addAlert('error', `Temperatura baixa: ${temperature.toFixed(1)}°C (mín: ${settings.tempMin}°C)`, 'temp-low');
    } else {
      clearAlertsByKey('temp-low');
    }

    if (temperature > settings.tempMax) {
      addAlert('error', `Temperatura alta: ${temperature.toFixed(1)}°C (máx: ${settings.tempMax}°C)`, 'temp-high');
    } else {
      clearAlertsByKey('temp-high');
    }

    // pH checks (manual input)
    if (settings.phAlertEnabled) {
      if (ph < settings.phMin) {
        addAlert('warning', `pH baixo: ${ph.toFixed(2)} (mín: ${settings.phMin})`, 'ph-low');
      } else {
        clearAlertsByKey('ph-low');
      }

      if (ph > settings.phMax) {
        addAlert('warning', `pH alto: ${ph.toFixed(2)} (máx: ${settings.phMax})`, 'ph-high');
      } else {
        clearAlertsByKey('ph-high');
      }
    } else {
      clearAlertsByKey('ph-low');
      clearAlertsByKey('ph-high');
    }

    // Salinity checks (SG - Specific Gravity)
    const salinitySg = normalizeSalinitySg(salinity);
    const salMin = normalizeSalinitySg(settings.salinityMin);
    const salMax = normalizeSalinitySg(settings.salinityMax);

    const hasValidSalinity =
      Number.isFinite(salinitySg) && Number.isFinite(salMin) && Number.isFinite(salMax);

    if (settings.salinityAlertEnabled && hasValidSalinity) {
      if (salinitySg < salMin) {
        addAlert('warning', `Salinidade baixa: ${salinitySg.toFixed(3)} SG (mín: ${salMin.toFixed(3)})`, 'sal-low');
      } else {
        clearAlertsByKey('sal-low');
      }

      if (salinitySg > salMax) {
        addAlert('warning', `Salinidade alta: ${salinitySg.toFixed(3)} SG (máx: ${salMax.toFixed(3)})`, 'sal-high');
      } else {
        clearAlertsByKey('sal-high');
      }
    } else {
      clearAlertsByKey('sal-low');
      clearAlertsByKey('sal-high');
    }

    // TDS checks (manual input)
    if (settings.tdsAlertEnabled) {
      if (tds < settings.tdsMin) {
        addAlert('info', `TDS baixo: ${tds} ppm (mín: ${settings.tdsMin} ppm)`, 'tds-low');
      } else {
        clearAlertsByKey('tds-low');
      }

      if (tds > settings.tdsMax) {
        addAlert('info', `TDS alto: ${tds} ppm (máx: ${settings.tdsMax} ppm)`, 'tds-high');
      } else {
        clearAlertsByKey('tds-high');
      }
    } else {
      clearAlertsByKey('tds-low');
      clearAlertsByKey('tds-high');
    }
  }, [params, settings, addAlert, clearAlertsByKey]);

  return {
    alerts,
    addAlert: (type: Alert['type'], message: string) => addAlert(type, message, `manual-${Date.now()}`),
    dismissAlert,
    clearAllAlerts,
    settings,
  };
}
