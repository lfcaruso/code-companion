import { Alert } from '@/types/aquarium';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  X, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  Trash2,
  CheckCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AlertsPanelProps {
  alerts: Alert[];
  onDismiss: (id: string) => void;
  onClearAll: () => void;
}

const alertConfig = {
  error: {
    icon: AlertCircle,
    color: 'text-destructive',
    bg: 'bg-destructive/10 border-destructive/30',
    badge: 'bg-destructive text-destructive-foreground',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-warning',
    bg: 'bg-warning/10 border-warning/30',
    badge: 'bg-warning text-warning-foreground',
  },
  info: {
    icon: Info,
    color: 'text-primary',
    bg: 'bg-primary/10 border-primary/30',
    badge: 'bg-primary text-primary-foreground',
  },
};

export function AlertsPanel({ alerts, onDismiss, onClearAll }: AlertsPanelProps) {
  const errorCount = alerts.filter(a => a.type === 'error').length;
  const warningCount = alerts.filter(a => a.type === 'warning').length;

  return (
    <Card className="glass-card border-border/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="relative">
              <Bell className="w-5 h-5 text-primary" />
              {alerts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full animate-pulse" />
              )}
            </div>
            Alertas
            {alerts.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {alerts.length}
              </Badge>
            )}
          </CardTitle>
          
          {alerts.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClearAll}
              className="text-muted-foreground hover:text-foreground gap-1"
            >
              <Trash2 className="w-4 h-4" />
              Limpar
            </Button>
          )}
        </div>
        
        {alerts.length > 0 && (
          <div className="flex gap-2 mt-2">
            {errorCount > 0 && (
              <Badge className="bg-destructive/20 text-destructive border-destructive/30">
                {errorCount} crítico{errorCount > 1 ? 's' : ''}
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge className="bg-warning/20 text-warning border-warning/30">
                {warningCount} aviso{warningCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <CheckCircle className="w-12 h-12 mb-3 text-success/50" />
            <p className="text-sm font-medium">Tudo normal!</p>
            <p className="text-xs">Nenhum alerta ativo no momento</p>
          </div>
        ) : (
          <ScrollArea className="h-[280px] pr-4">
            <div className="space-y-2">
              {alerts.map((alert) => {
                const config = alertConfig[alert.type];
                const Icon = config.icon;
                
                return (
                  <div
                    key={alert.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${config.bg} animate-in slide-in-from-top-2 duration-300`}
                  >
                    <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${config.color}`} />
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight">
                        {alert.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(alert.timestamp, { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </p>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-foreground flex-shrink-0"
                      onClick={() => onDismiss(alert.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
