import { useEffect, useState } from 'react';

interface Bubble {
  id: number;
  left: number;
  size: number;
  delay: number;
  duration: number;
}

export function BubbleBackground() {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);

  useEffect(() => {
    const generateBubbles = () => {
      const newBubbles: Bubble[] = [];
      for (let i = 0; i < 15; i++) {
        newBubbles.push({
          id: i,
          left: Math.random() * 100,
          size: 4 + Math.random() * 12,
          delay: Math.random() * 10,
          duration: 8 + Math.random() * 8,
        });
      }
      return newBubbles;
    };

    setBubbles(generateBubbles());
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-water-deep/20 via-transparent to-background/80" />
      
      {/* Animated glow */}
      <div 
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-30"
        style={{ background: 'var(--gradient-glow)' }}
      />

      {/* Bubbles */}
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className="bubble"
          style={{
            left: `${bubble.left}%`,
            width: `${bubble.size}px`,
            height: `${bubble.size}px`,
            animationDelay: `${bubble.delay}s`,
            animationDuration: `${bubble.duration}s`,
            bottom: '-20px',
          }}
        />
      ))}
    </div>
  );
}
