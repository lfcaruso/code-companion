import { useState } from 'react';
import { Beaker, Droplet, Activity, TrendingUp, TrendingDown, Minus, Edit3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MarineParameters } from '@/types/aquarium';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { format } from 'date-fns';

interface MarineParametersCardProps {
  params: MarineParameters;
  onUpdateManualParams?: (ph: number, tds: number) => void;
}

const getPhStatus = (ph: number) => {
  if (ph >= 8.1 && ph <= 8.4) return { status: 'Ideal', color: 'text-green-400' };
  if (ph >= 7.9 && ph <= 8.5) return { status: 'Aceitável', color: 'text-yellow-400' };
  return { status: 'Crítico', color: 'text-red-400' };
};

const getSalinityStatus = (salinity: number) => {
  // SG (Specific Gravity) ideal range
  if (salinity >= 1.024 && salinity <= 1.026) return { status: 'Ideal', color: 'text-green-400' };
  if (salinity >= 1.022 && salinity <= 1.028) return { status: 'Aceitável', color: 'text-yellow-400' };
  return { status: 'Crítico', color: 'text-red-400' };
};

const getTdsStatus = (tds: number) => {
  if (tds >= 100 && tds <= 300) return { status: 'Ideal', color: 'text-green-400' };
  if (tds >= 50 && tds <= 400) return { status: 'Aceitável', color: 'text-yellow-400' };
  return { status: 'Crítico', color: 'text-red-400' };
};

const getTrend = (history: { value: number }[]) => {
  if (history.length < 2) return 'stable';
  const recent = history.slice(-5);
  const avg = recent.reduce((a, b) => a + b.value, 0) / recent.length;
  const first = recent[0]?.value || avg;
  const diff = avg - first;
  if (diff > 0.05) return 'up';
  if (diff < -0.05) return 'down';
  return 'stable';
};

const TrendIcon = ({ trend }: { trend: string }) => {
  if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-400" />;
  if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-400" />;
  return <Minus className="w-4 h-4 text-muted-foreground" />;
};

export function MarineParametersCard({ params, onUpdateManualParams }: MarineParametersCardProps) {
  const [activeTab, setActiveTab] = useState('ph');
  const [isEditing, setIsEditing] = useState(false);
  const [editPh, setEditPh] = useState(params.ph.toString());
  const [editTds, setEditTds] = useState(params.tds.toString());
  
  const phStatus = getPhStatus(params.ph);
  const salinityStatus = getSalinityStatus(params.salinity);
  const tdsStatus = getTdsStatus(params.tds);

  const phChartData = params.phHistory.map(reading => ({
    time: format(reading.timestamp, 'HH:mm'),
    value: reading.value,
  }));

  const salinityChartData = params.salinityHistory.map(reading => ({
    time: format(reading.timestamp, 'HH:mm'),
    value: reading.value,
  }));

  const tdsChartData = params.tdsHistory.map(reading => ({
    time: format(reading.timestamp, 'HH:mm'),
    value: reading.value,
  }));

  const handleSaveManual = () => {
    const ph = parseFloat(editPh);
    const tds = parseInt(editTds);
    if (!isNaN(ph) && !isNaN(tds) && onUpdateManualParams) {
      onUpdateManualParams(ph, tds);
    }
    setIsEditing(false);
  };

  const parameters = [
    {
      id: 'ph',
      name: 'pH',
      value: params.ph.toFixed(2),
      unit: '',
      icon: Beaker,
      status: phStatus,
      trend: getTrend(params.phHistory),
      chartData: phChartData,
      color: 'hsl(var(--primary))',
      idealRange: '8.1 - 8.4',
      isManual: true,
    },
    {
      id: 'salinity',
      name: 'Salinidade',
      value: params.salinity.toFixed(3),
      unit: 'SG',
      icon: Droplet,
      status: salinityStatus,
      trend: getTrend(params.salinityHistory),
      chartData: salinityChartData,
      color: 'hsl(var(--accent))',
      idealRange: '1.024 - 1.026 SG',
      isManual: false,
    },
    {
      id: 'tds',
      name: 'TDS',
      value: params.tds.toString(),
      unit: 'ppm',
      icon: Activity,
      status: tdsStatus,
      trend: getTrend(params.tdsHistory),
      chartData: tdsChartData,
      color: 'hsl(142, 76%, 36%)',
      idealRange: '100 - 300 ppm',
      isManual: true,
    },
  ];

  const activeParam = parameters.find(p => p.id === activeTab) || parameters[0];

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Beaker className="w-5 h-5 text-primary" />
            Parâmetros Marinhos
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            className="text-xs gap-1"
          >
            <Edit3 className="w-3 h-3" />
            {isEditing ? 'Cancelar' : 'Editar Manual'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Manual Input Form */}
        {isEditing && (
          <div className="p-3 rounded-lg bg-secondary/50 border border-border/30 space-y-3">
            <p className="text-xs text-muted-foreground">Inserir valores manualmente (pH e TDS)</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">pH</label>
                <Input
                  type="number"
                  step="0.01"
                  value={editPh}
                  onChange={(e) => setEditPh(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">TDS (ppm)</label>
                <Input
                  type="number"
                  step="1"
                  value={editTds}
                  onChange={(e) => setEditTds(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <Button onClick={handleSaveManual} size="sm" className="w-full">
              Salvar
            </Button>
          </div>
        )}

        {/* Parameter Cards Row */}
        <div className="grid grid-cols-3 gap-3">
          {parameters.map((param) => (
            <button
              key={param.id}
              onClick={() => setActiveTab(param.id)}
              className={`p-3 rounded-xl transition-all duration-300 text-left relative
                ${activeTab === param.id 
                  ? 'bg-primary/20 border border-primary/30 shadow-lg shadow-primary/10' 
                  : 'bg-secondary/50 border border-border/30 hover:bg-secondary/80'}`}
            >
              {param.isManual && (
                <span className="absolute top-1 right-1 text-[8px] text-muted-foreground bg-muted/50 px-1 rounded">
                  MANUAL
                </span>
              )}
              <div className="flex items-center gap-2 mb-1">
                <param.icon className={`w-4 h-4 ${activeTab === param.id ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-xs text-muted-foreground">{param.name}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold">{param.value}</span>
                <span className="text-xs text-muted-foreground">{param.unit}</span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <span className={`text-xs ${param.status.color}`}>{param.status.status}</span>
                <TrendIcon trend={param.trend} />
              </div>
            </button>
          ))}
        </div>

        {/* Chart */}
        <div className="h-40 mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Últimas 24h</span>
            <span className="text-xs text-muted-foreground">Ideal: {activeParam.idealRange}</span>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={activeParam.chartData}>
              <defs>
                <linearGradient id={`gradient-${activeParam.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={activeParam.color} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={activeParam.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="time" 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                width={35}
                domain={['auto', 'auto']}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={activeParam.color}
                strokeWidth={2}
                fill={`url(#gradient-${activeParam.id})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}