'use client';

import { useTheme } from 'next-themes';

interface BackgroundProps {
  children: React.ReactNode;
}

export function Background({ children }: BackgroundProps) {
  const { theme } = useTheme();

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      {/* Gradient overlays with increased intensity */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            theme === 'dark'
              ? 'radial-gradient(circle at 50% 0%, rgba(76, 29, 149, 0.25), transparent 35%), ' +
                'radial-gradient(circle at 0% 50%, rgba(124, 58, 237, 0.2), transparent 60%), ' +
                'radial-gradient(circle at 100% 50%, rgba(139, 92, 246, 0.2), transparent 60%)'
              : 'radial-gradient(circle at 50% 0%, rgba(216, 180, 254, 0.25), transparent 35%), ' +
                'radial-gradient(circle at 0% 50%, rgba(192, 132, 252, 0.2), transparent 60%), ' +
                'radial-gradient(circle at 100% 50%, rgba(168, 85, 247, 0.2), transparent 60%)',
        }}
      />

      {/* Blur elements with increased size and intensity */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -left-1/4 top-0 h-[600px] w-[600px] rounded-full bg-purple-500/30 blur-[150px]" />
        <div className="absolute -right-1/4 bottom-0 h-[600px] w-[600px] rounded-full bg-violet-500/30 blur-[150px]" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
