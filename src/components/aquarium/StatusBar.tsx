import { Wifi, Clock, Bell, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState, useEffect } from 'react';

export function StatusBar() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-border/30 backdrop-blur-lg bg-card/30 sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
          <span className="text-lg font-bold text-primary-foreground">🐠</span>
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">AquaMonitor</h1>
          <p className="text-xs text-muted-foreground">Dashboard v1.32.1</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span className="font-mono text-sm">
            {format(time, 'HH:mm:ss')}
          </span>
          <span className="text-xs">
            {format(time, 'dd MMM', { locale: ptBR })}
          </span>
        </div>

        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-success/10">
          <Wifi className="w-4 h-4 text-success" />
          <span className="text-xs text-success font-medium">Online</span>
        </div>

        <button className="p-2 rounded-lg hover:bg-secondary transition-colors relative">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-coral" />
        </button>

        <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
          <Settings className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
