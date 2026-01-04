// ESP32 API Service for aquarium data
// When served from ESP32, uses relative URLs (same origin)
// Custom URL can be set for development/testing purposes

const getDefaultBaseUrl = (): string => {
  // Check if custom URL is set in localStorage (for development/external access)
  const customUrl = localStorage.getItem('esp32_url');
  if (customUrl) {
    return customUrl;
  }
  // Default to same origin (empty string) when served from ESP32
  return '';
};

export interface ESP32SensorData {
  temperature: number;
  temperatureSetpoint: number;
  ph: number;
  salinity: number;
  orp: number;
  relays: {
    id: number;
    state: boolean;
    autoMode: boolean;
    timerEnabled: boolean;
    timerOnHour: number;
    timerOnMinute: number;
    timerOffHour: number;
    timerOffMinute: number;
  }[];
  energy: {
    currentWatts: number;
    dailyKwh: number;
    monthlyKwh: number;
    cost: number;
  };
  timestamp: string;
}

// Configuration data structure for EEPROM storage
export interface ESP32ConfigData {
  // Temperature settings
  tempMin: number;
  tempMax: number;
  tempSetpoint: number;
  tempHysteresis: number;
  
  // pH settings
  phMin: number;
  phMax: number;
  phAlertEnabled: boolean;
  
  // Salinity settings
  salinityMin: number;
  salinityMax: number;
  salinityAlertEnabled: boolean;
  
  // ORP settings
  orpMin: number;
  orpMax: number;
  orpAlertEnabled: boolean;
  
  // General settings
  refreshInterval: number;
  alertsEnabled: boolean;
  soundEnabled: boolean;
  autoModeEnabled: boolean;
}

export interface ESP32Response<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class ESP32ApiService {
  private baseUrl: string;
  private isConnected: boolean = false;
  private lastError: string | null = null;

  constructor() {
    this.baseUrl = getDefaultBaseUrl();
  }

  setBaseUrl(url: string) {
    // Empty string means same origin (served from ESP32)
    this.baseUrl = url;
    if (url) {
      localStorage.setItem('esp32_url', url);
    } else {
      localStorage.removeItem('esp32_url');
    }
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  // Check if using same-origin (served from ESP32)
  isEmbeddedMode(): boolean {
    return this.baseUrl === '';
  }

  getConnectionStatus(): { isConnected: boolean; lastError: string | null } {
    return { isConnected: this.isConnected, lastError: this.lastError };
  }

  async fetchSensorData(): Promise<ESP32Response<ESP32SensorData>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/sensors`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      this.isConnected = true;
      this.lastError = null;
      return { success: true, data };
    } catch (error) {
      this.isConnected = false;
      this.lastError = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: this.lastError };
    }
  }

  async setRelayState(relayId: number, state: boolean): Promise<ESP32Response<void>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/relay/${relayId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ state }),
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      this.isConnected = true;
      this.lastError = null;
      return { success: true };
    } catch (error) {
      this.isConnected = false;
      this.lastError = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: this.lastError };
    }
  }

  async setRelayTimer(
    relayId: number, 
    timerEnabled: boolean,
    onHour: number,
    onMinute: number,
    offHour: number,
    offMinute: number
  ): Promise<ESP32Response<void>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/relay/${relayId}/timer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          timerEnabled, 
          onHour, 
          onMinute, 
          offHour, 
          offMinute 
        }),
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      this.isConnected = true;
      this.lastError = null;
      return { success: true };
    } catch (error) {
      this.isConnected = false;
      this.lastError = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: this.lastError };
    }
  }

  async setTemperatureSetpoint(setpoint: number): Promise<ESP32Response<void>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/temperature/setpoint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ setpoint }),
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      this.isConnected = true;
      this.lastError = null;
      return { success: true };
    } catch (error) {
      this.isConnected = false;
      this.lastError = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: this.lastError };
    }
  }

  async updateRelayName(relayId: number, name: string): Promise<ESP32Response<void>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/relay/${relayId}/name`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      this.isConnected = true;
      this.lastError = null;
      return { success: true };
    } catch (error) {
      this.isConnected = false;
      this.lastError = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: this.lastError };
    }
  }

  // Fetch configuration from ESP32 EEPROM
  async fetchConfig(): Promise<ESP32Response<ESP32ConfigData>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/config`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      this.isConnected = true;
      this.lastError = null;
      return { success: true, data };
    } catch (error) {
      this.isConnected = false;
      this.lastError = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: this.lastError };
    }
  }

  // Save configuration to ESP32 EEPROM
  async saveConfig(config: ESP32ConfigData): Promise<ESP32Response<void>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      this.isConnected = true;
      this.lastError = null;
      return { success: true };
    } catch (error) {
      this.isConnected = false;
      this.lastError = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: this.lastError };
    }
  }

  // Reset ESP32 configuration to factory defaults
  async resetConfig(): Promise<ESP32Response<ESP32ConfigData>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/config/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      this.isConnected = true;
      this.lastError = null;
      return { success: true, data };
    } catch (error) {
      this.isConnected = false;
      this.lastError = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: this.lastError };
    }
  }
}

export const esp32Api = new ESP32ApiService();
