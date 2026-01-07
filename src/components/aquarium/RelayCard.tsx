import { Sun, Waves, Thermometer, Droplets, Wind, Utensils, Timer, Settings2, Snowflake, Zap, Power } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Relay } from '@/types/aquarium';
import { useState } from 'react';
import { TimerModal } from './TimerModal';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  sun: Sun,
  waves: Waves,
  thermometer: Thermometer,
  droplets: Droplets,
  wind: Wind,
  utensils: Utensils,
  snowflake: Snowflake,
  zap: Zap,
  power: Power,
};

interface RelayCardProps {
  relay: Relay;
  onToggle: () => void;
  onUpdate: (updates: Partial<Relay>) => void;
}

export function RelayCard({ relay, onToggle, onUpdate }: RelayCardProps) {
  const [showTimer, setShowTimer] = useState(false);
  const Icon = iconMap[relay.icon] || Sun;

  const formatTime = (hour: number, minute: number) => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <div 
        className={`glass-card p-5 transition-all duration-300 group relative overflow-hidden
          ${relay.state ? 'border-primary/30' : 'border-border/30'}
          hover:border-primary/50 hover:scale-[1.02]`}
      >
        {/* Active glow */}
        {relay.state && (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
        )}

        <div className="flex items-start justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl transition-all duration-300
              ${relay.state ? 'bg-primary/20 shadow-[0_0_15px_hsl(var(--primary)/0.3)]' : 'bg-muted'}`}>
              <Icon className={`w-5 h-5 transition-colors duration-300 
                ${relay.state ? 'text-primary' : 'text-muted-foreground'}`} 
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-sm">{relay.name}</h4>
                {relay.autoMode && (
                  <span className="text-[10px] font-medium text-accent bg-accent/10 px-1.5 py-0.5 rounded-full">
                    AUTO
                  </span>
                )}
              </div>
              <span className={`text-xs ${relay.state ? 'text-primary' : 'text-muted-foreground'}`}>
                {relay.state ? 'Ligado' : 'Desligado'}
              </span>
            </div>
          </div>

          <Switch 
            checked={relay.state} 
            onCheckedChange={onToggle}
          />
        </div>

        {/* Timer info */}
        <div className="mt-4 pt-3 border-t border-border/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className={`w-4 h-4 ${relay.timerEnabled ? 'text-accent' : 'text-muted-foreground'}`} />
            {relay.timerEnabled ? (
              <span className="text-xs text-muted-foreground">
                {formatTime(relay.timerOnHour, relay.timerOnMinute)} → {formatTime(relay.timerOffHour, relay.timerOffMinute)}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">Timer desativado</span>
            )}
          </div>
          
          <button 
            onClick={() => setShowTimer(true)}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors opacity-0 group-hover:opacity-100"
          >
            <Settings2 className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

      </div>

      <TimerModal 
        relay={relay}
        open={showTimer}
        onClose={() => setShowTimer(false)}
        onSave={onUpdate}
      />
    </>
  );
}
