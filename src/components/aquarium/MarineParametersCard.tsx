import { useState } from 'react';
import { Beaker, Droplet, Activity, TrendingUp, TrendingDown, Minus, Edit3, Atom, FlaskConical, TestTube } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MarineParameters } from '@/types/aquarium';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { format } from 'date-fns';

interface ManualParamsUpdate {
  ph?: number;
  salinity?: number;
  tds?: number;
  kh?: number;
  calcium?: number;
  magnesium?: number;
  nitrate?: number;
  phosphate?: number;
}

interface MarineParametersCardProps {
  params: MarineParameters;
  onUpdateManualParams?: (params: ManualParamsUpdate) => void;
}

const getPhStatus = (ph: number) => {
  if (ph >= 8.1 && ph <= 8.4) return { status: 'Ideal', color: 'text-green-400' };
  if (ph >= 7.9 && ph <= 8.5) return { status: 'Aceitável', color: 'text-yellow-400' };
  return { status: 'Crítico', color: 'text-red-400' };
};

const getSalinityStatus = (salinity: number) => {
  if (salinity >= 1.024 && salinity <= 1.026) return { status: 'Ideal', color: 'text-green-400' };
  if (salinity >= 1.022 && salinity <= 1.028) return { status: 'Aceitável', color: 'text-yellow-400' };
  return { status: 'Crítico', color: 'text-red-400' };
};

const getTdsStatus = (tds: number) => {
  if (tds >= 100 && tds <= 300) return { status: 'Ideal', color: 'text-green-400' };
  if (tds >= 50 && tds <= 400) return { status: 'Aceitável', color: 'text-yellow-400' };
  return { status: 'Crítico', color: 'text-red-400' };
};

const getKhStatus = (kh: number) => {
  if (kh >= 7 && kh <= 11) return { status: 'Ideal', color: 'text-green-400' };
  if (kh >= 6 && kh <= 12) return { status: 'Aceitável', color: 'text-yellow-400' };
  return { status: 'Crítico', color: 'text-red-400' };
};

const getCalciumStatus = (calcium: number) => {
  if (calcium >= 400 && calcium <= 450) return { status: 'Ideal', color: 'text-green-400' };
  if (calcium >= 380 && calcium <= 480) return { status: 'Aceitável', color: 'text-yellow-400' };
  return { status: 'Crítico', color: 'text-red-400' };
};

const getMagnesiumStatus = (magnesium: number) => {
  if (magnesium >= 1250 && magnesium <= 1400) return { status: 'Ideal', color: 'text-green-400' };
  if (magnesium >= 1150 && magnesium <= 1500) return { status: 'Aceitável', color: 'text-yellow-400' };
  return { status: 'Crítico', color: 'text-red-400' };
};

const getNitrateStatus = (nitrate: number) => {
  if (nitrate >= 0 && nitrate <= 10) return { status: 'Ideal', color: 'text-green-400' };
  if (nitrate <= 20) return { status: 'Aceitável', color: 'text-yellow-400' };
  return { status: 'Crítico', color: 'text-red-400' };
};

const getPhosphateStatus = (phosphate: number) => {
  if (phosphate >= 0 && phosphate <= 0.03) return { status: 'Ideal', color: 'text-green-400' };
  if (phosphate <= 0.1) return { status: 'Aceitável', color: 'text-yellow-400' };
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
  const [editValues, setEditValues] = useState({
    ph: params.ph.toString(),
    salinity: params.salinity.toString(),
    tds: params.tds.toString(),
    kh: params.kh.toString(),
    calcium: params.calcium.toString(),
    magnesium: params.magnesium.toString(),
    nitrate: params.nitrate.toString(),
    phosphate: params.phosphate.toString(),
  });

  const handleEditChange = (field: keyof typeof editValues, value: string) => {
    setEditValues(prev => ({ ...prev, [field]: value }));
  };

  const parameters = [
    {
      id: 'ph',
      name: 'pH',
      value: params.ph.toFixed(2),
      unit: '',
      icon: Beaker,
      status: getPhStatus(params.ph),
      trend: getTrend(params.phHistory),
      chartData: params.phHistory.map(r => ({ time: format(r.timestamp, 'HH:mm'), value: r.value })),
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
      status: getSalinityStatus(params.salinity),
      trend: getTrend(params.salinityHistory),
      chartData: params.salinityHistory.map(r => ({ time: format(r.timestamp, 'HH:mm'), value: r.value })),
      color: 'hsl(var(--accent))',
      idealRange: '1.024 - 1.026 SG',
      isManual: true,
    },
    {
      id: 'kh',
      name: 'KH',
      value: params.kh.toFixed(1),
      unit: 'dKH',
      icon: FlaskConical,
      status: getKhStatus(params.kh),
      trend: getTrend(params.khHistory),
      chartData: params.khHistory.map(r => ({ time: format(r.timestamp, 'HH:mm'), value: r.value })),
      color: 'hsl(280, 70%, 50%)',
      idealRange: '7 - 11 dKH',
      isManual: true,
    },
    {
      id: 'calcium',
      name: 'Cálcio',
      value: params.calcium.toString(),
      unit: 'ppm',
      icon: Atom,
      status: getCalciumStatus(params.calcium),
      trend: getTrend(params.calciumHistory),
      chartData: params.calciumHistory.map(r => ({ time: format(r.timestamp, 'HH:mm'), value: r.value })),
      color: 'hsl(45, 90%, 50%)',
      idealRange: '400 - 450 ppm',
      isManual: true,
    },
    {
      id: 'magnesium',
      name: 'Magnésio',
      value: params.magnesium.toString(),
      unit: 'ppm',
      icon: Atom,
      status: getMagnesiumStatus(params.magnesium),
      trend: getTrend(params.magnesiumHistory),
      chartData: params.magnesiumHistory.map(r => ({ time: format(r.timestamp, 'HH:mm'), value: r.value })),
      color: 'hsl(180, 70%, 45%)',
      idealRange: '1250 - 1400 ppm',
      isManual: true,
    },
    {
      id: 'nitrate',
      name: 'Nitrato',
      value: params.nitrate.toFixed(1),
      unit: 'ppm',
      icon: TestTube,
      status: getNitrateStatus(params.nitrate),
      trend: getTrend(params.nitrateHistory),
      chartData: params.nitrateHistory.map(r => ({ time: format(r.timestamp, 'HH:mm'), value: r.value })),
      color: 'hsl(25, 95%, 53%)',
      idealRange: '0 - 10 ppm',
      isManual: true,
    },
    {
      id: 'phosphate',
      name: 'Fosfato',
      value: params.phosphate.toFixed(2),
      unit: 'ppm',
      icon: TestTube,
      status: getPhosphateStatus(params.phosphate),
      trend: getTrend(params.phosphateHistory),
      chartData: params.phosphateHistory.map(r => ({ time: format(r.timestamp, 'HH:mm'), value: r.value })),
      color: 'hsl(330, 80%, 50%)',
      idealRange: '0 - 0.03 ppm',
      isManual: true,
    },
    {
      id: 'tds',
      name: 'TDS',
      value: params.tds.toString(),
      unit: 'ppm',
      icon: Activity,
      status: getTdsStatus(params.tds),
      trend: getTrend(params.tdsHistory),
      chartData: params.tdsHistory.map(r => ({ time: format(r.timestamp, 'HH:mm'), value: r.value })),
      color: 'hsl(142, 76%, 36%)',
      idealRange: '100 - 300 ppm',
      isManual: true,
    },
  ];

  const activeParam = parameters.find(p => p.id === activeTab) || parameters[0];

  // Convert salinity input to SG format (accepts 1025 or 1.025)
  const normalizeSalinity = (value: string): number | undefined => {
    const num = parseFloat(value);
    if (isNaN(num)) return undefined;
    // If value is >= 1000, assume it's in ppt-like format (e.g., 1025 -> 1.025)
    if (num >= 1000) {
      return num / 1000;
    }
    return num;
  };

  const handleSaveManual = () => {
    if (onUpdateManualParams) {
      const updates: ManualParamsUpdate = {};
      
      const ph = parseFloat(editValues.ph);
      if (!isNaN(ph)) updates.ph = ph;
      
      const salinity = normalizeSalinity(editValues.salinity);
      if (salinity !== undefined) updates.salinity = salinity;
      
      const tds = parseInt(editValues.tds);
      if (!isNaN(tds)) updates.tds = tds;
      
      const kh = parseFloat(editValues.kh);
      if (!isNaN(kh)) updates.kh = kh;
      
      const calcium = parseInt(editValues.calcium);
      if (!isNaN(calcium)) updates.calcium = calcium;
      
      const magnesium = parseInt(editValues.magnesium);
      if (!isNaN(magnesium)) updates.magnesium = magnesium;
      
      const nitrate = parseFloat(editValues.nitrate);
      if (!isNaN(nitrate)) updates.nitrate = nitrate;
      
      const phosphate = parseFloat(editValues.phosphate);
      if (!isNaN(phosphate)) updates.phosphate = phosphate;
      
      onUpdateManualParams(updates);
    }
    setIsEditing(false);
  };

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
            onClick={() => {
            if (!isEditing) {
                setEditValues({
                  ph: params.ph.toString(),
                  salinity: params.salinity.toString(),
                  tds: params.tds.toString(),
                  kh: params.kh.toString(),
                  calcium: params.calcium.toString(),
                  magnesium: params.magnesium.toString(),
                  nitrate: params.nitrate.toString(),
                  phosphate: params.phosphate.toString(),
                });
              }
              setIsEditing(!isEditing);
            }}
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
            <p className="text-xs text-muted-foreground">Inserir valores manualmente</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">pH</label>
                <Input
                  type="number"
                  step="0.01"
                  value={editValues.ph}
                  onChange={(e) => handleEditChange('ph', e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Salinidade (1.025 ou 1025)</label>
                <Input
                  type="number"
                  step="any"
                  placeholder="1.025 ou 1025"
                  value={editValues.salinity}
                  onChange={(e) => handleEditChange('salinity', e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">KH (dKH)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={editValues.kh}
                  onChange={(e) => handleEditChange('kh', e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Cálcio (ppm)</label>
                <Input
                  type="number"
                  step="1"
                  value={editValues.calcium}
                  onChange={(e) => handleEditChange('calcium', e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Magnésio (ppm)</label>
                <Input
                  type="number"
                  step="1"
                  value={editValues.magnesium}
                  onChange={(e) => handleEditChange('magnesium', e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Nitrato (ppm)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={editValues.nitrate}
                  onChange={(e) => handleEditChange('nitrate', e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Fosfato (ppm)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={editValues.phosphate}
                  onChange={(e) => handleEditChange('phosphate', e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">TDS (ppm)</label>
                <Input
                  type="number"
                  step="1"
                  value={editValues.tds}
                  onChange={(e) => handleEditChange('tds', e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <Button onClick={handleSaveManual} size="sm" className="w-full">
              Salvar
            </Button>
          </div>
        )}

        {/* Parameter Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {parameters.map((param) => (
            <button
              key={param.id}
              onClick={() => setActiveTab(param.id)}
              className={`p-2.5 rounded-xl transition-all duration-300 text-left relative
                ${activeTab === param.id 
                  ? 'bg-primary/20 border border-primary/30 shadow-lg shadow-primary/10' 
                  : 'bg-secondary/50 border border-border/30 hover:bg-secondary/80'}`}
            >
              {param.isManual && (
                <span className="absolute top-0.5 right-0.5 text-[7px] text-muted-foreground bg-muted/50 px-1 rounded">
                  M
                </span>
              )}
              <div className="flex items-center gap-1.5 mb-0.5">
                <param.icon className={`w-3.5 h-3.5 ${activeTab === param.id ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-[10px] text-muted-foreground truncate">{param.name}</span>
              </div>
              <div className="flex items-baseline gap-0.5">
                <span className="text-base font-bold">{param.value}</span>
                <span className="text-[9px] text-muted-foreground">{param.unit}</span>
              </div>
              <div className="flex items-center gap-0.5 mt-0.5">
                <span className={`text-[9px] ${param.status.color}`}>{param.status.status}</span>
                <TrendIcon trend={param.trend} />
              </div>
            </button>
          ))}
        </div>

        {/* Chart */}
        <div className="h-36 mt-3">
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