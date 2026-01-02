import { Droplets, Gauge, Activity, AlertTriangle } from 'lucide-react';

export function QuickStats() {
  const stats = [
    { icon: Droplets, label: 'pH', value: '6.8', status: 'optimal', unit: '' },
    { icon: Gauge, label: 'Pressão', value: '1.2', status: 'optimal', unit: 'bar' },
    { icon: Activity, label: 'TDS', value: '180', status: 'warning', unit: 'ppm' },
    { icon: AlertTriangle, label: 'Alertas', value: '2', status: 'alert', unit: '' },
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
