export interface Relay {
  id: number;
  name: string;
  state: boolean;
  autoMode: boolean;
  timerEnabled: boolean;
  timerOnHour: number;
  timerOnMinute: number;
  timerOffHour: number;
  timerOffMinute: number;
  icon: string;
  isFixed?: boolean; // For relays with fixed names (Aquecedor and Resfriamento)
}

export interface TemperatureReading {
  timestamp: Date;
  value: number;
}

export interface ParameterReading {
  timestamp: Date;
  value: number;
}

export interface MarineParameters {
  ph: number;
  phHistory: ParameterReading[];
  salinity: number; // in SG (Specific Gravity)
  salinityHistory: ParameterReading[];
  tds: number; // in ppm
  tdsHistory: ParameterReading[];
}

export interface EnergyData {
  currentWatts: number;
  dailyKwh: number;
  monthlyKwh: number;
  cost: number;
}

export interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: Date;
}
