import { Thermometer, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { TemperatureReading } from '@/types/aquarium';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { format } from 'date-fns';

interface TemperatureCardProps {
  current: number;
  setpoint: number;
  history: TemperatureReading[];
}

export function TemperatureCard({ current, setpoint, history }: TemperatureCardProps) {
  const diff = current - setpoint;
  const status = Math.abs(diff) < 0.5 ? 'optimal' : diff > 0 ? 'high' : 'low';
  
  const chartData = history.map(reading => ({
    time: format(reading.timestamp, 'HH:mm'),
    value: reading.value,
    setpoint: setpoint,
  }));

  const getTrendIcon = () => {
    if (history.length < 2) return <Minus className="w-4 h-4" />;
    const recent = history[history.length - 1].value;
    const previous = history[history.length - 2].value;
    if (recent > previous + 0.05) return <TrendingUp className="w-4 h-4 text-coral" />;
    if (recent < previous - 0.05) return <TrendingDown className="w-4 h-4 text-primary" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <div className="glass-card p-6 relative overflow-hidden">
      {/* Glow effect based on status */}
      <div 
        className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 
          ${status === 'optimal' ? 'bg-success' : status === 'high' ? 'bg-coral' : 'bg-primary'}`} 
      />
      
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${status === 'optimal' ? 'bg-success/20' : status === 'high' ? 'bg-coral/20' : 'bg-primary/20'}`}>
            <Thermometer className={`w-6 h-6 ${status === 'optimal' ? 'text-success' : status === 'high' ? 'text-coral' : 'text-primary'}`} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Temperatura</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold tracking-tight">{current.toFixed(1)}</span>
              <span className="text-lg text-muted-foreground">°C</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50">
          {getTrendIcon()}
          <span className="text-xs font-medium text-muted-foreground">
            Setpoint: {setpoint.toFixed(1)}°C
          </span>
        </div>
      </div>

      {/* Temperature Chart */}
      <div className="h-40 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="time" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis 
              domain={['dataMin - 1', 'dataMax + 1']}
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}°`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#tempGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Status indicator */}
      <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-border/50">
        <div className={`w-2 h-2 rounded-full ${status === 'optimal' ? 'bg-success' : status === 'high' ? 'bg-coral' : 'bg-primary'} animate-pulse`} />
        <span className="text-xs text-muted-foreground">
          {status === 'optimal' ? 'Temperatura ideal' : status === 'high' ? 'Acima do setpoint' : 'Abaixo do setpoint'}
        </span>
      </div>
    </div>
  );
}
