import React, { useEffect, useRef, useState } from 'react';
import { getProcessedMonsterCanvas } from './monsterAssets';

export interface MonsterRendererProps {
  frameKey: string;
  fallbackSrc: string;
  alt?: string;
  isIdle?: boolean;
  className?: string;
}

export const MonsterRenderer: React.FC<MonsterRendererProps> = ({
  frameKey,
  fallbackSrc,
  alt = 'The Digital Playground fluffy monster mascot',
  isIdle = true,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [useCanvas, setUseCanvas] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const sourceCanvas = getProcessedMonsterCanvas(frameKey);
    if (sourceCanvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(sourceCanvas, 0, 0);
        setUseCanvas(true);
        return;
      }
    }

    setUseCanvas(false);
  }, [frameKey]);

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center select-none ${
        isIdle ? 'monster-float-idle' : ''
      } ${className}`}
    >
      {/* High-Performance Canvas for Transparent, Normalized Frames */}
      <canvas
        ref={canvasRef}
        width={500}
        height={500}
        aria-hidden="true"
        className={`w-full h-full object-contain transition-opacity duration-150 pointer-events-none ${
          useCanvas ? 'opacity-100' : 'opacity-0 absolute inset-0'
        }`}
      />

      {/* Fallback Image if canvas is not ready or during initial hydration */}
      {!useCanvas && (
        <img
          src={fallbackSrc}
          alt={alt}
          draggable={false}
          className="w-full h-full object-contain pointer-events-none"
        />
      )}
    </div>
  );
};

export default MonsterRenderer;
