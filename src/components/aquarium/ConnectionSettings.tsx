import { useState } from 'react';
import { Wifi, WifiOff, Settings, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { esp32Api } from '@/services/esp32Api';

interface ConnectionSettingsProps {
  isConnected: boolean;
  lastError: string | null;
  onUrlChange: (url: string) => void;
}

export function ConnectionSettings({ isConnected, lastError, onUrlChange }: ConnectionSettingsProps) {
  const [url, setUrl] = useState(esp32Api.getBaseUrl());
  const [isOpen, setIsOpen] = useState(false);
  const isEmbedded = esp32Api.isEmbeddedMode();

  const handleSave = () => {
    esp32Api.setBaseUrl(url);
    onUrlChange(url);
    setIsOpen(false);
  };

  const handleUseEmbedded = () => {
    setUrl('');
    esp32Api.setBaseUrl('');
    onUrlChange('');
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={`gap-2 ${isConnected ? 'border-green-500/50 text-green-400' : 'border-red-500/50 text-red-400'}`}
        >
          {isConnected ? (
            <>
              <Wifi className="h-4 w-4" />
              <span className="hidden sm:inline">ESP32 Conectada</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4" />
              <span className="hidden sm:inline">Sem Conexão</span>
            </>
          )}
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Configuração ESP32</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isEmbedded 
              ? 'Modo embarcado: página servida diretamente do ESP32.'
              : 'Configure o endereço IP da sua ESP32 para receber dados em tempo real.'
            }
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          {/* Embedded mode indicator */}
          {isEmbedded && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <Wifi className="h-4 w-4 text-primary" />
              <span className="text-sm text-foreground">
                Modo Embarcado - Servido do ESP32
              </span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">URL da ESP32 (opcional)</label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Deixe vazio para modo embarcado"
              className="bg-background border-border text-foreground"
            />
            <p className="text-xs text-muted-foreground">
              Vazio = modo embarcado (mesma origem). Para acesso externo: http://192.168.1.100
            </p>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-lg bg-background/50">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
            <span className="text-sm text-foreground">
              {isConnected ? 'Conectado' : 'Desconectado'}
            </span>
            {lastError && (
              <span className="text-xs text-red-400 ml-2">({lastError})</span>
            )}
          </div>

          <div className="flex gap-2 justify-end flex-wrap">
            {!isEmbedded && (
              <Button variant="ghost" onClick={handleUseEmbedded} className="text-muted-foreground">
                Usar Modo Embarcado
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
              <Check className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
