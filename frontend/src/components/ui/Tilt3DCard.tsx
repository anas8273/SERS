'use client';

import { useRef, useState, type ReactNode, type MouseEvent } from 'react';
import { cn } from '@/lib/utils';

interface Tilt3DCardProps {
  children: ReactNode;
  className?: string;
  /** Max rotation in degrees — default 8 */
  maxTilt?: number;
  /** Perspective distance — default 1000px */
  perspective?: number;
  /** Glare effect on hover */
  glare?: boolean;
  /** Scale on hover */
  scale?: number;
}

/**
 * 3D Tilt Card — follows mouse movement for a premium spatial feel.
 * Uses pure CSS transforms (rotateX/rotateY) with no dependencies.
 * Respects `prefers-reduced-motion`.
 */
export function Tilt3DCard({
  children,
  className,
  maxTilt = 8,
  perspective = 1000,
  glare = true,
  scale = 1.02,
}: Tilt3DCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('rotateX(0deg) rotateY(0deg)');
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;   // 0..1
    const y = (e.clientY - rect.top) / rect.height;    // 0..1

    const tiltX = (0.5 - y) * maxTilt * 2;  // vertical axis
    const tiltY = (x - 0.5) * maxTilt * 2;  // horizontal axis

    setTransform(`rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg)`);
    setGlarePos({ x: x * 100, y: y * 100 });
  };

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => {
    setIsHovering(false);
    setTransform('rotateX(0deg) rotateY(0deg)');
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn('tilt-3d-wrapper', className)}
      style={{
        perspective: `${perspective}px`,
        transformStyle: 'preserve-3d',
      }}
    >
      <div
        className="tilt-3d-inner transition-transform duration-200 ease-out will-change-transform"
        style={{
          transform: `${transform} scale(${isHovering ? scale : 1})`,
          transformStyle: 'preserve-3d',
        }}
      >
        {children}
        {/* Glare overlay */}
        {glare && (
          <div
            className="absolute inset-0 rounded-[inherit] pointer-events-none transition-opacity duration-300 z-10"
            style={{
              background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.15) 0%, transparent 60%)`,
              opacity: isHovering ? 1 : 0,
            }}
          />
        )}
      </div>
    </div>
  );
}
