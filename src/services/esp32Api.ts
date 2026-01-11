/**
 * ESP32 API Service for Aquarium Monitoring System
 * 
 * EMBEDDED MODE (Cartão SD / ESP32):
 * - All files (HTML, CSS, JS) are served from microSD card connected to ESP32
 * - All data is stored on microSD card - NO external database required
 * - API endpoints use relative URLs (same origin) - no CORS issues
 * - Portable: just move the ESP32+SD card to any location
 * 
 * STORAGE STRUCTURE ON SD CARD:
 * /
 * ├── index.html, assets/      (Web interface files)
 * ├── data/
 * │   ├── config.json          (System configuration)
 * │   ├── relays.json          (Relay names and settings)
 * │   ├── parameters.json      (Manual parameter readings)
 * │   └── history/
 * │       ├── temp_YYYY-MM.json    (Temperature history by month)
 * │       ├── params_YYYY-MM.json  (Parameters history by month)
 * │       └── energy_YYYY-MM.json  (Energy history by month)
 * 
 * API ENDPOINTS (ESP32 must implement):
 * 
 * SENSORS & CONTROL:
 * - GET  /api/sensors           - Returns sensor data (temperature, relays, energy)
 * - POST /api/relay/:id         - Toggle relay state { state: boolean }
 * - POST /api/relay/:id/timer   - Configure relay timer
 * - POST /api/relay/:id/name    - Update relay name (saves to SD)
 * - POST /api/temperature/setpoint - Set temperature target
 * 
 * CONFIGURATION (EEPROM + SD):
 * - GET  /api/config            - Read configuration
 * - POST /api/config            - Save configuration
 * - POST /api/config/reset      - Reset to factory defaults
 * 
 * DATA PERSISTENCE (SD Card):
 * - GET  /api/data/parameters   - Read manual parameters
 * - POST /api/data/parameters   - Save manual parameters
 * - GET  /api/data/history/:type/:year/:month - Read history data
 * - POST /api/data/history/:type - Append to history
 * - GET  /api/data/export       - Export all data as ZIP
 * - POST /api/data/import       - Import data from ZIP
 * - DELETE /api/data/history/:type/:year/:month - Delete specific history file
 * 
 * DEVELOPMENT MODE:
 * - Custom URL can be set via ConnectionSettings dialog
 * - Stored in localStorage for persistence
 */

const getDefaultBaseUrl = (): string => {
  // Check if custom URL is set in localStorage (for development/external access)
  const customUrl = localStorage.getItem('esp32_url');
  if (customUrl) {
    return customUrl;
  }
  // Default to same origin (empty string) when served from ESP32's SD card
  return '';
};

export interface ESP32SensorData {
  temperature: number;
  temperatureSetpoint: number;
  // pH and TDS are manual input, not from sensors
  salinity: number; // SG (Specific Gravity) from refractometer
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
  
  // pH settings (manual input)
  phMin: number;
  phMax: number;
  phAlertEnabled: boolean;
  
  // Salinity settings (SG - Specific Gravity)
  salinityMin: number;
  salinityMax: number;
  salinityAlertEnabled: boolean;
  
  // TDS settings (manual input)
  tdsMin: number;
  tdsMax: number;
  tdsAlertEnabled: boolean;
  
  // General settings
  refreshInterval: number;
  alertsEnabled: boolean;
  soundEnabled: boolean;
  autoModeEnabled: boolean;
}

// Manual parameters stored on SD card
export interface ManualParametersData {
  ph: number;
  kh: number;
  calcium: number;
  magnesium: number;
  nitrate: number;
  phosphate: number;
  lastUpdated: string;
}

// History entry for time-series data
export interface HistoryEntry {
  timestamp: string;
  value: number;
}

// History data structure stored on SD card
export interface HistoryData {
  type: 'temperature' | 'ph' | 'salinity' | 'kh' | 'calcium' | 'magnesium' | 'nitrate' | 'phosphate' | 'energy';
  year: number;
  month: number;
  entries: HistoryEntry[];
}

// Relay configuration stored on SD card
export interface RelayConfigData {
  id: number;
  name: string;
  icon: string;
  isFixed: boolean;
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

  // ========== SD CARD DATA PERSISTENCE ==========

  // Fetch manual parameters from SD card
  async fetchManualParameters(): Promise<ESP32Response<ManualParametersData>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/data/parameters`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
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

  // Save manual parameters to SD card
  async saveManualParameters(params: ManualParametersData): Promise<ESP32Response<void>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/data/parameters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
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

  // Fetch history data from SD card
  async fetchHistory(type: string, year: number, month: number): Promise<ESP32Response<HistoryData>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/data/history/${type}/${year}/${month}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
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

  // Append entry to history on SD card
  async appendHistory(type: string, entry: HistoryEntry): Promise<ESP32Response<void>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/data/history/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
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

  // Delete specific history file from SD card
  async deleteHistory(type: string, year: number, month: number): Promise<ESP32Response<void>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/data/history/${type}/${year}/${month}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
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

  // Export all data as downloadable file
  async exportData(): Promise<ESP32Response<Blob>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/data/export`, {
        method: 'GET',
        signal: AbortSignal.timeout(30000), // Longer timeout for export
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      this.isConnected = true;
      this.lastError = null;
      return { success: true, data: blob };
    } catch (error) {
      this.isConnected = false;
      this.lastError = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: this.lastError };
    }
  }

  // Import data from file
  async importData(file: File): Promise<ESP32Response<void>> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${this.baseUrl}/api/data/import`, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(30000), // Longer timeout for import
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

  // Fetch relay configurations from SD card
  async fetchRelayConfigs(): Promise<ESP32Response<RelayConfigData[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/data/relays`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
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

  // Save relay configurations to SD card
  async saveRelayConfigs(configs: RelayConfigData[]): Promise<ESP32Response<void>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/data/relays`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configs),
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
}

export const esp32Api = new ESP32ApiService();
