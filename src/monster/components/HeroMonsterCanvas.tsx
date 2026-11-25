import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import { HeroMonsterModel } from './HeroMonsterModel';
import { HeroMonsterFallback, MonsterErrorBoundary } from './HeroMonsterFallback';

interface HeroMonsterCanvasProps {
  isActive?: boolean;
  className?: string;
}

function isWebGLSupported(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl2') || canvas.getContext('webgl'))
    );
  } catch {
    return false;
  }
}

const MonsterLoadingPlaceholder: React.FC = () => (
  <div
    className="absolute inset-0 flex items-center justify-center pointer-events-none"
    aria-hidden="true"
  >
    <div className="w-28 h-28 rounded-full border-2 border-stone-200 border-t-teal-700/60 animate-spin" />
  </div>
);

export const HeroMonsterCanvas: React.FC<HeroMonsterCanvasProps> = ({
  isActive = true,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [webglReady] = useState<boolean>(() =>
    typeof window !== 'undefined' ? isWebGLSupported() : true
  );
  const [contextLost, setContextLost] = useState(false);
  const [reducedMotion, setReducedMotion] = useState<boolean>(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  if (!webglReady || contextLost) {
    return (
      <div className={`relative ${className}`}>
        <HeroMonsterFallback />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center justify-center select-none ${className}`}
      aria-label="Interactive 3D fluffy monster mascot"
      role="img"
    >
      {/* Subtle miniature-world architectural stage accents — sized independently of mascot scale */}
      <div
        className="pointer-events-none absolute w-[68%] aspect-square translate-y-[5%] rounded-full border border-stone-200/80"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute w-[54%] aspect-square translate-y-[5%] rounded-full bg-stone-100/70"
        aria-hidden="true"
      />
      {/* Tiny editorial registration dots for miniature-diorama feel */}
      <span
        className="pointer-events-none absolute top-[18%] right-[16%] w-2 h-2 rounded-full bg-teal-700/30"
        aria-hidden="true"
      />
      <span
        className="pointer-events-none absolute bottom-[15%] left-[14%] w-1.5 h-1.5 rounded-full bg-amber-500/40"
        aria-hidden="true"
      />

      <MonsterErrorBoundary>
        <Suspense fallback={<MonsterLoadingPlaceholder />}>
          <Canvas
            dpr={[1, 1.75]}
            frameloop={isActive ? 'always' : 'demand'}
            camera={{ position: [0, 0.35, 6.5], fov: 37, near: 0.1, far: 50 }}
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: 'high-performance',
            }}
            onCreated={({ gl }) => {
              const dom = gl.domElement;
              const onLost = (e: Event) => {
                e.preventDefault();
                setContextLost(true);
              };
              const onRestored = () => setContextLost(false);
              dom.addEventListener('webglcontextlost', onLost, false);
              dom.addEventListener('webglcontextrestored', onRestored, false);
            }}
            className="w-full h-full touch-pan-y"
          >
            {/* Warm editorial studio lighting */}
            <ambientLight intensity={0.75} color="#FFFDF9" />
            <hemisphereLight args={['#FFFDF8', '#D6E4E1', 0.95]} />
            <directionalLight
              position={[3.5, 5.5, 4.5]}
              intensity={1.55}
              color="#FFF9F0"
            />
            {/* Soft cool-teal rim light to accentuate fluffy fur silhouette */}
            <directionalLight
              position={[-4.0, 2.8, -3.0]}
              intensity={0.95}
              color="#99F6E4"
            />
            {/* Gentle bottom bounce fill */}
            <directionalLight
              position={[0, -2.5, 2.5]}
              intensity={0.35}
              color="#E7E5E4"
            />

            <HeroMonsterModel
              isActive={isActive}
              reducedMotion={reducedMotion}
              containerRef={containerRef}
            />

            <ContactShadows
              position={[0, -1.34, 0]}
              opacity={0.34}
              scale={4.5}
              blur={2.3}
              far={2.8}
              color="#44403C"
              frames={reducedMotion ? 1 : 30}
            />
          </Canvas>
        </Suspense>
      </MonsterErrorBoundary>
    </div>
  );
};

export default HeroMonsterCanvas;
