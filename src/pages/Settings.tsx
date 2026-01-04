import { useState, useEffect } from 'react';
import { BubbleBackground } from '@/components/aquarium/BubbleBackground';
import { StatusBar } from '@/components/aquarium/StatusBar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { esp32Api, ESP32ConfigData } from '@/services/esp32Api';
import { 
  ArrowLeft, 
  Thermometer, 
  Droplets, 
  Waves, 
  Zap, 
  Save, 
  RotateCcw,
  Settings as SettingsIcon,
  Bell,
  Wifi,
  Download,
  Upload,
  Loader2,
  HardDrive
} from 'lucide-react';

type SystemSettings = ESP32ConfigData;

const defaultSettings: SystemSettings = {
  tempMin: 24.0,
  tempMax: 27.0,
  tempSetpoint: 25.5,
  tempHysteresis: 0.5,
  phMin: 8.0,
  phMax: 8.4,
  phAlertEnabled: true,
  salinityMin: 32,
  salinityMax: 36,
  salinityAlertEnabled: true,
  orpMin: 300,
  orpMax: 450,
  orpAlertEnabled: true,
  refreshInterval: 3,
  alertsEnabled: true,
  soundEnabled: false,
  autoModeEnabled: true,
};

const Settings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Load settings from ESP32 on mount
  useEffect(() => {
    loadFromESP32();
  }, []);

  const loadFromESP32 = async () => {
    setIsLoading(true);
    const result = await esp32Api.fetchConfig();
    
    if (result.success && result.data) {
      setSettings(result.data);
      setIsConnected(true);
      toast({
        title: "Configurações carregadas",
        description: "Dados lidos da EEPROM do ESP32.",
      });
    } else {
      // Fallback to localStorage if ESP32 not available
      const saved = localStorage.getItem('aquarium-settings');
      if (saved) {
        setSettings(JSON.parse(saved));
      }
      setIsConnected(false);
      toast({
        title: "ESP32 não conectado",
        description: "Usando configurações locais. " + (result.error || ''),
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const updateSetting = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    // Always save to localStorage as backup
    localStorage.setItem('aquarium-settings', JSON.stringify(settings));
    
    // Try to save to ESP32 EEPROM
    const result = await esp32Api.saveConfig(settings);
    
    if (result.success) {
      setIsConnected(true);
      toast({
        title: "Salvo na EEPROM",
        description: "Configurações gravadas no ESP32 com sucesso.",
      });
    } else {
      setIsConnected(false);
      toast({
        title: "Salvo localmente",
        description: "ESP32 não disponível. Configurações salvas apenas no navegador.",
        variant: "destructive",
      });
    }
    
    setHasChanges(false);
    setIsSaving(false);
  };

  const handleReset = async () => {
    setIsLoading(true);
    
    // Try to reset on ESP32
    const result = await esp32Api.resetConfig();
    
    if (result.success && result.data) {
      setSettings(result.data);
      setIsConnected(true);
      toast({
        title: "Reset da EEPROM",
        description: "Configurações de fábrica restauradas no ESP32.",
      });
    } else {
      setSettings(defaultSettings);
      toast({
        title: "Valores padrão",
        description: "Restaurados valores padrão localmente.",
      });
    }
    
    setHasChanges(true);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen relative">
      <BubbleBackground />
      
      <div className="relative z-10">
        <StatusBar />
        
        <main className="container mx-auto px-4 py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20">
                <SettingsIcon className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Configurações</h2>
                <p className="text-muted-foreground">Setpoints e ajustes do sistema</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Connection status indicator */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs ${
                isConnected 
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                  : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
              }`}>
                <HardDrive className="w-3 h-3" />
                {isConnected ? 'EEPROM' : 'Local'}
              </div>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={loadFromESP32}
                disabled={isLoading}
                className="gap-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span className="hidden sm:inline">Ler ESP32</span>
              </Button>
              
              <Button variant="outline" onClick={handleReset} disabled={isLoading} className="gap-2">
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Reset</span>
              </Button>
              
              <Button onClick={handleSave} disabled={!hasChanges || isSaving} className="gap-2">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Salvar
              </Button>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Temperature Settings */}
            <Card className="glass-card border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Thermometer className="w-5 h-5 text-primary" />
                  Temperatura
                </CardTitle>
                <CardDescription>Defina os limites e setpoint de temperatura</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Setpoint (°C)</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[settings.tempSetpoint]}
                      onValueChange={([v]) => updateSetting('tempSetpoint', v)}
                      min={20}
                      max={30}
                      step={0.1}
                      className="flex-1"
                    />
                    <span className="font-mono text-lg w-16 text-right">{settings.tempSetpoint.toFixed(1)}°</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Mínimo (°C)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={settings.tempMin}
                      onChange={(e) => updateSetting('tempMin', parseFloat(e.target.value))}
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Máximo (°C)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={settings.tempMax}
                      onChange={(e) => updateSetting('tempMax', parseFloat(e.target.value))}
                      className="font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Histerese (°C)</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[settings.tempHysteresis]}
                      onValueChange={([v]) => updateSetting('tempHysteresis', v)}
                      min={0.1}
                      max={2}
                      step={0.1}
                      className="flex-1"
                    />
                    <span className="font-mono text-sm w-12 text-right">{settings.tempHysteresis.toFixed(1)}°</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Margem para evitar oscilações no controle</p>
                </div>
              </CardContent>
            </Card>

            {/* pH Settings */}
            <Card className="glass-card border-accent/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Droplets className="w-5 h-5 text-accent" />
                  pH
                </CardTitle>
                <CardDescription>Limites para água do mar (ideal: 8.1-8.4)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Mínimo</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={settings.phMin}
                      onChange={(e) => updateSetting('phMin', parseFloat(e.target.value))}
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Máximo</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={settings.phMax}
                      onChange={(e) => updateSetting('phMax', parseFloat(e.target.value))}
                      className="font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-muted-foreground" />
                    <Label>Alertas de pH</Label>
                  </div>
                  <Switch
                    checked={settings.phAlertEnabled}
                    onCheckedChange={(v) => updateSetting('phAlertEnabled', v)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Salinity Settings */}
            <Card className="glass-card border-blue-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Waves className="w-5 h-5 text-blue-400" />
                  Salinidade
                </CardTitle>
                <CardDescription>Limites em ppt (ideal: 33-35 ppt)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Mínimo (ppt)</Label>
                    <Input
                      type="number"
                      step="1"
                      value={settings.salinityMin}
                      onChange={(e) => updateSetting('salinityMin', parseInt(e.target.value))}
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Máximo (ppt)</Label>
                    <Input
                      type="number"
                      step="1"
                      value={settings.salinityMax}
                      onChange={(e) => updateSetting('salinityMax', parseInt(e.target.value))}
                      className="font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-muted-foreground" />
                    <Label>Alertas de Salinidade</Label>
                  </div>
                  <Switch
                    checked={settings.salinityAlertEnabled}
                    onCheckedChange={(v) => updateSetting('salinityAlertEnabled', v)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* ORP Settings */}
            <Card className="glass-card border-yellow-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  ORP
                </CardTitle>
                <CardDescription>Potencial Redox (ideal: 350-450 mV)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Mínimo (mV)</Label>
                    <Input
                      type="number"
                      step="10"
                      value={settings.orpMin}
                      onChange={(e) => updateSetting('orpMin', parseInt(e.target.value))}
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Máximo (mV)</Label>
                    <Input
                      type="number"
                      step="10"
                      value={settings.orpMax}
                      onChange={(e) => updateSetting('orpMax', parseInt(e.target.value))}
                      className="font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-muted-foreground" />
                    <Label>Alertas de ORP</Label>
                  </div>
                  <Switch
                    checked={settings.orpAlertEnabled}
                    onCheckedChange={(v) => updateSetting('orpAlertEnabled', v)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* General Settings */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <SettingsIcon className="w-5 h-5 text-muted-foreground" />
                Configurações Gerais
              </CardTitle>
              <CardDescription>Ajustes do sistema e notificações</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground flex items-center gap-2">
                    <Wifi className="w-4 h-4" />
                    Intervalo de Atualização (s)
                  </Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[settings.refreshInterval]}
                      onValueChange={([v]) => updateSetting('refreshInterval', v)}
                      min={1}
                      max={30}
                      step={1}
                      className="flex-1"
                    />
                    <span className="font-mono text-sm w-8 text-right">{settings.refreshInterval}s</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-muted-foreground" />
                    <Label>Alertas Visuais</Label>
                  </div>
                  <Switch
                    checked={settings.alertsEnabled}
                    onCheckedChange={(v) => updateSetting('alertsEnabled', v)}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-muted-foreground" />
                    <Label>Som de Alertas</Label>
                  </div>
                  <Switch
                    checked={settings.soundEnabled}
                    onCheckedChange={(v) => updateSetting('soundEnabled', v)}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-muted-foreground" />
                    <Label>Modo Automático</Label>
                  </div>
                  <Switch
                    checked={settings.autoModeEnabled}
                    onCheckedChange={(v) => updateSetting('autoModeEnabled', v)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <footer className="text-center py-8 border-t border-border/20">
            <p className="text-xs text-muted-foreground">
              AquaMonitor Dashboard • Baseado no código Arduino v1.32.1
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default Settings;
