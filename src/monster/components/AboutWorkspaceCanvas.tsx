import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import { AboutWorkspaceScene } from './AboutWorkspaceScene';
import { HeroMonsterFallback, MonsterErrorBoundary } from './HeroMonsterFallback';

interface AboutWorkspaceCanvasProps {
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

const WorkspaceLoadingPlaceholder: React.FC = () => (
  <div
    className="absolute inset-0 flex items-center justify-center pointer-events-none"
    aria-hidden="true"
  >
    <div className="w-24 h-24 rounded-full border-2 border-stone-200 border-t-teal-700/60 animate-spin" />
  </div>
);

export const AboutWorkspaceCanvas: React.FC<AboutWorkspaceCanvasProps> = ({
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
        <HeroMonsterFallback message="Cozy workspace standby" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center justify-center select-none ${className}`}
      aria-label="Interactive 3D monster working at a miniature developer desk"
      role="img"
    >
      {/* Subtle circular studio stage accent matching Hero's editorial universe */}
      <div
        className="pointer-events-none absolute w-[76%] aspect-square translate-y-[4%] rounded-full border border-stone-200/80"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute w-[62%] aspect-square translate-y-[4%] rounded-full bg-stone-100/70"
        aria-hidden="true"
      />
      <span
        className="pointer-events-none absolute top-[14%] left-[16%] w-2 h-2 rounded-full bg-teal-700/30"
        aria-hidden="true"
      />
      <span
        className="pointer-events-none absolute bottom-[16%] right-[14%] w-1.5 h-1.5 rounded-full bg-amber-500/40"
        aria-hidden="true"
      />

      {/* Dedicated monster + workspace wrapper shifted slightly left on desktop without moving background */}
      <div className="w-full h-full lg:-translate-x-8 xl:-translate-x-9">
        <MonsterErrorBoundary>
          <Suspense fallback={<WorkspaceLoadingPlaceholder />}>
            <Canvas
              dpr={[1, 1.75]}
              frameloop={isActive ? 'always' : 'demand'}
              camera={{ position: [0.35, 1.55, 6.9], fov: 35, near: 0.1, far: 50 }}
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
              {/* Warm cozy studio lighting */}
              <ambientLight intensity={0.72} color="#FFFDF9" />
              <hemisphereLight args={['#FFFDF8', '#D6E4E1', 0.92]} />
              <directionalLight
                position={[4.0, 6.0, 4.5]}
                intensity={1.5}
                color="#FFF8EE"
              />
              <directionalLight
                position={[-4.5, 3.0, -2.5]}
                intensity={0.85}
                color="#BAE6FD"
              />
              <directionalLight
                position={[0, -2.0, 2.5]}
                intensity={0.3}
                color="#E7E5E4"
              />

              <AboutWorkspaceScene
                isActive={isActive}
                reducedMotion={reducedMotion}
                containerRef={containerRef}
              />

              <ContactShadows
                position={[0, -1.21, 0.25]}
                opacity={0.34}
                scale={6.0}
                blur={2.4}
                far={3.2}
                color="#44403C"
                frames={reducedMotion ? 1 : 25}
              />
            </Canvas>
          </Suspense>
        </MonsterErrorBoundary>
      </div>
    </div>
  );
};

export default AboutWorkspaceCanvas;
