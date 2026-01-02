import { Zap, TrendingUp, DollarSign } from 'lucide-react';
import { EnergyData } from '@/types/aquarium';

interface EnergyCardProps {
  energy: EnergyData;
}

export function EnergyCard({ energy }: EnergyCardProps) {
  return (
    <div className="glass-card p-6 relative overflow-hidden">
      {/* Glow */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-warning/20 rounded-full blur-3xl" />
      
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-xl bg-warning/20">
          <Zap className="w-6 h-6 text-warning" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Consumo de Energia</h3>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold">{energy.currentWatts}</span>
            <span className="text-muted-foreground">W</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="p-3 rounded-xl bg-secondary/30">
          <p className="text-xs text-muted-foreground mb-1">Hoje</p>
          <p className="text-lg font-semibold">{energy.dailyKwh.toFixed(1)}</p>
          <p className="text-xs text-muted-foreground">kWh</p>
        </div>
        
        <div className="p-3 rounded-xl bg-secondary/30">
          <p className="text-xs text-muted-foreground mb-1">Mensal</p>
          <p className="text-lg font-semibold">{energy.monthlyKwh.toFixed(1)}</p>
          <p className="text-xs text-muted-foreground">kWh</p>
        </div>
        
        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
          <p className="text-xs text-muted-foreground mb-1">Custo</p>
          <p className="text-lg font-semibold text-primary">R$ {energy.cost.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">/mês</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/30">
        <TrendingUp className="w-4 h-4 text-success" />
        <span className="text-xs text-muted-foreground">
          12% menor que mês anterior
        </span>
      </div>
    </div>
  );
}
