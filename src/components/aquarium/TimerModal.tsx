import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Relay } from '@/types/aquarium';
import { Clock, Save } from 'lucide-react';

interface TimerModalProps {
  relay: Relay;
  open: boolean;
  onClose: () => void;
  onSave: (updates: Partial<Relay>) => void;
}

export function TimerModal({ relay, open, onClose, onSave }: TimerModalProps) {
  const [timerEnabled, setTimerEnabled] = useState(relay.timerEnabled);
  const [autoMode, setAutoMode] = useState(relay.autoMode);
  const [onHour, setOnHour] = useState(relay.timerOnHour);
  const [onMinute, setOnMinute] = useState(relay.timerOnMinute);
  const [offHour, setOffHour] = useState(relay.timerOffHour);
  const [offMinute, setOffMinute] = useState(relay.timerOffMinute);

  const handleSave = () => {
    onSave({
      timerEnabled,
      autoMode,
      timerOnHour: onHour,
      timerOnMinute: onMinute,
      timerOffHour: offHour,
      timerOffMinute: offMinute,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-card border-border/50 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Configurar Timer - {relay.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Timer Enable */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
            <div>
              <Label className="font-medium">Timer Ativo</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Liga/desliga automaticamente nos horários definidos
              </p>
            </div>
            <Switch checked={timerEnabled} onCheckedChange={setTimerEnabled} />
          </div>

          {/* Auto Mode */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
            <div>
              <Label className="font-medium">Modo Automático</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Controle baseado em sensores e condições
              </p>
            </div>
            <Switch checked={autoMode} onCheckedChange={setAutoMode} />
          </div>

          {/* Time Inputs */}
          <div className={`space-y-4 transition-opacity duration-300 ${timerEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            <div className="p-4 rounded-xl bg-success/10 border border-success/20">
              <Label className="text-success font-medium mb-3 block">Horário de Ligar</Label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={onHour}
                  onChange={(e) => setOnHour(parseInt(e.target.value) || 0)}
                  className="w-16 px-3 py-2 rounded-lg bg-background border border-border text-center font-mono"
                />
                <span className="text-2xl font-light text-muted-foreground">:</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={onMinute}
                  onChange={(e) => setOnMinute(parseInt(e.target.value) || 0)}
                  className="w-16 px-3 py-2 rounded-lg bg-background border border-border text-center font-mono"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
              <Label className="text-destructive font-medium mb-3 block">Horário de Desligar</Label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={offHour}
                  onChange={(e) => setOffHour(parseInt(e.target.value) || 0)}
                  className="w-16 px-3 py-2 rounded-lg bg-background border border-border text-center font-mono"
                />
                <span className="text-2xl font-light text-muted-foreground">:</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={offMinute}
                  onChange={(e) => setOffMinute(parseInt(e.target.value) || 0)}
                  className="w-16 px-3 py-2 rounded-lg bg-background border border-border text-center font-mono"
                />
              </div>
            </div>
          </div>

          <Button onClick={handleSave} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            <Save className="w-4 h-4 mr-2" />
            Salvar Configurações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
