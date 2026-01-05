import { Droplets, Waves, Activity, AlertTriangle, Atom, FlaskConical } from 'lucide-react';
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

  const getKhStatus = (kh: number) => {
    if (kh >= 7 && kh <= 11) return 'optimal';
    if (kh >= 6 && kh <= 12) return 'warning';
    return 'alert';
  };

  const getCalciumStatus = (calcium: number) => {
    if (calcium >= 400 && calcium <= 450) return 'optimal';
    if (calcium >= 380 && calcium <= 480) return 'warning';
    return 'alert';
  };

  const stats = [
    { icon: Droplets, label: 'pH', value: params.ph.toFixed(2), status: getPhStatus(params.ph), unit: '' },
    { icon: Waves, label: 'Salinidade', value: params.salinity.toFixed(3), status: getSalinityStatus(params.salinity), unit: 'SG' },
    { icon: FlaskConical, label: 'KH', value: params.kh.toFixed(1), status: getKhStatus(params.kh), unit: 'dKH' },
    { icon: Atom, label: 'Cálcio', value: params.calcium.toString(), status: getCalciumStatus(params.calcium), unit: 'ppm' },
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
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
      {stats.map((stat) => (
        <div 
          key={stat.label}
          className="glass-card p-3 flex items-center gap-2.5 hover:border-primary/30 transition-all duration-300 hover:scale-[1.02]"
        >
          <div className={`p-2 rounded-xl ${getStatusColor(stat.status)}`}>
            <stat.icon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            <p className="text-lg font-bold leading-tight">
              {stat.value}
              {stat.unit && <span className="text-[9px] font-normal text-muted-foreground ml-0.5">{stat.unit}</span>}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}