import { BubbleBackground } from '@/components/aquarium/BubbleBackground';
import { StatusBar } from '@/components/aquarium/StatusBar';
import { TemperatureCard } from '@/components/aquarium/TemperatureCard';
import { RelayCard } from '@/components/aquarium/RelayCard';
import { EnergyCard } from '@/components/aquarium/EnergyCard';
import { QuickStats } from '@/components/aquarium/QuickStats';
import { useAquariumData } from '@/hooks/useAquariumData';
import { Fish } from 'lucide-react';

const Index = () => {
  const {
    temperature,
    temperatureSetpoint,
    temperatureHistory,
    relays,
    toggleRelay,
    updateRelay,
    energy,
  } = useAquariumData();

  return (
    <div className="min-h-screen relative">
      <BubbleBackground />
      
      <div className="relative z-10">
        <StatusBar />
        
        <main className="container mx-auto px-4 py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 animate-pulse-glow">
              <Fish className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Meu Aquário</h2>
              <p className="text-muted-foreground">Plantado 200L • Água doce tropical</p>
            </div>
          </div>

          {/* Quick Stats */}
          <QuickStats />

          {/* Main Grid */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Temperature */}
            <TemperatureCard 
              current={temperature}
              setpoint={temperatureSetpoint}
              history={temperatureHistory}
            />

            {/* Energy */}
            <EnergyCard energy={energy} />
          </div>

          {/* Relays Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Controle de Equipamentos</h3>
              <span className="text-xs text-muted-foreground">
                {relays.filter(r => r.state).length} de {relays.length} ativos
              </span>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {relays.map((relay) => (
                <RelayCard
                  key={relay.id}
                  relay={relay}
                  onToggle={() => toggleRelay(relay.id)}
                  onUpdate={(updates) => updateRelay(relay.id, updates)}
                />
              ))}
            </div>
          </div>

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

export default Index;
