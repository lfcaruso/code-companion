// ESP32 API Service for aquarium data
// Configure this URL to match your ESP32's IP address

const ESP32_BASE_URL = localStorage.getItem('esp32_url') || 'http://192.168.1.100';

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
    this.baseUrl = ESP32_BASE_URL;
  }

  setBaseUrl(url: string) {
    this.baseUrl = url;
    localStorage.setItem('esp32_url', url);
  }

  getBaseUrl(): string {
    return this.baseUrl;
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
}

export const esp32Api = new ESP32ApiService();
