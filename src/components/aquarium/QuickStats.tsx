import { Droplets, Waves, Activity, AlertTriangle } from 'lucide-react';
import { MarineParameters } from '@/types/aquarium';

interface QuickStatsProps {
  params: MarineParameters;
  alertCount: number;
}

export function QuickStats({ params, alertCount }: QuickStatsProps) {
  const getPhStatus = (ph: number) => {
    if (ph >= 8.1 && ph <= 8.4) return 'optimal';
    if (ph >= 7.9 && ph <= 8.5) return 'warning';
    return 'alert';
  };

  const getSalinityStatus = (sg: number) => {
    if (sg >= 1.024 && sg <= 1.026) return 'optimal';
    if (sg >= 1.022 && sg <= 1.028) return 'warning';
    return 'alert';
  };

  const getTdsStatus = (tds: number) => {
    if (tds >= 100 && tds <= 300) return 'optimal';
    if (tds >= 50 && tds <= 400) return 'warning';
    return 'alert';
  };

  const stats = [
    { icon: Droplets, label: 'pH', value: params.ph.toFixed(2), status: getPhStatus(params.ph), unit: '' },
    { icon: Waves, label: 'Salinidade', value: params.salinity.toFixed(3), status: getSalinityStatus(params.salinity), unit: 'SG' },
    { icon: Activity, label: 'TDS', value: params.tds.toString(), status: getTdsStatus(params.tds), unit: 'ppm' },
    { icon: AlertTriangle, label: 'Alertas', value: alertCount.toString(), status: alertCount > 0 ? 'alert' : 'optimal', unit: '' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimal': return 'text-success bg-success/20';
      case 'warning': return 'text-warning bg-warning/20';
      case 'alert': return 'text-coral bg-coral/20';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div 
          key={stat.label}
          className="glass-card p-4 flex items-center gap-3 hover:border-primary/30 transition-all duration-300 hover:scale-[1.02]"
        >
          <div className={`p-2.5 rounded-xl ${getStatusColor(stat.status)}`}>
            <stat.icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="text-xl font-bold">
              {stat.value}
              {stat.unit && <span className="text-xs font-normal text-muted-foreground ml-1">{stat.unit}</span>}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
