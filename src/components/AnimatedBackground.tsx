import { useEffect, useState } from 'react';

interface Dot {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  opacity: number;
}

const colors = [
  'hsl(263, 70%, 50%)', // Primary purple
  'hsl(180, 100%, 50%)', // Accent cyan
  'hsl(280, 100%, 70%)', // Gradient via
  'hsl(300, 70%, 60%)', // Pink
  'hsl(240, 100%, 70%)', // Blue
];

export function AnimatedBackground() {
  const [dots, setDots] = useState<Dot[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Initialize dots
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    // Create initial dots
    const initialDots: Dot[] = [];
    const numDots = 5; // Fixed number of dots

    for (let i = 0; i < numDots; i++) {
      initialDots.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 2, // Velocity between -1 and 1
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 8 + 2, // Size between 2 and 10
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: Math.random() * 0.6 + 0.2, // Opacity between 0.2 and 0.8
      });
    }

    setDots(initialDots);

    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  // Animate dots
  useEffect(() => {
    if (dots.length === 0) return;

    const animationFrame = setInterval(() => {
      setDots(prevDots => 
        prevDots.map(dot => {
          let newX = dot.x + dot.vx;
          let newY = dot.y + dot.vy;
          let newVx = dot.vx;
          let newVy = dot.vy;

          // Bounce off edges
          if (newX <= 0 || newX >= dimensions.width) {
            newVx = -newVx;
            newX = Math.max(0, Math.min(dimensions.width, newX));
          }
          if (newY <= 0 || newY >= dimensions.height) {
            newVy = -newVy;
            newY = Math.max(0, Math.min(dimensions.height, newY));
          }

          return {
            ...dot,
            x: newX,
            y: newY,
            vx: newVx,
            vy: newVy,
          };
        })
      );
    }, 50); // Update every 50ms for smooth animation

    return () => clearInterval(animationFrame);
  }, [dots.length, dimensions]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {dots.map(dot => (
        <div
          key={dot.id}
          className="absolute rounded-full transition-all duration-75 ease-linear"
          style={{
            left: `${dot.x}px`,
            top: `${dot.y}px`,
            width: `${dot.size}px`,
            height: `${dot.size}px`,
            backgroundColor: dot.color,
            opacity: dot.opacity,
            boxShadow: `0 0 ${dot.size * 2}px ${dot.color}`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
    </div>
  );
}