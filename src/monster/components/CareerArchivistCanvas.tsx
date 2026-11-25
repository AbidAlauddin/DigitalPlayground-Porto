import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import { CareerArchivistScene } from './CareerArchivistScene';
import { HeroMonsterFallback, MonsterErrorBoundary } from './HeroMonsterFallback';

interface CareerArchivistCanvasProps {
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

const ArchivistLoadingPlaceholder: React.FC = () => (
  <div
    className="absolute inset-0 flex items-center justify-center pointer-events-none"
    aria-hidden="true"
  >
    <div className="w-16 h-16 rounded-full border-2 border-stone-200 border-t-teal-700/60 animate-spin" />
  </div>
);

export const CareerArchivistCanvas: React.FC<CareerArchivistCanvasProps> = ({
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
        <HeroMonsterFallback message="Career archivist standby" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex items-center justify-center select-none overflow-visible ${className}`}
      aria-label="Interactive 3D Career Archivist Monster managing milestone documents"
      role="img"
    >
      {/* Background Soft Companion Glow / Stage Accent */}
      <div
        className="pointer-events-none absolute inset-x-[6%] top-[10%] bottom-[10%] rounded-full bg-teal-500/[0.04] blur-2xl -z-10"
        aria-hidden="true"
      />

      {/* Main 3D Canvas Container — Expanded horizontal render area so ContactShadows never clip at container edges (height preserved so monster/desk scale is 100% unchanged) */}
      <div className="relative -mx-8 sm:-mx-12 lg:-mx-20 w-[calc(100%+4rem)] sm:w-[calc(100%+6rem)] lg:w-[calc(100%+10rem)] h-full min-h-[360px] sm:min-h-[440px] lg:min-h-[520px] flex items-center justify-center overflow-visible">
        <MonsterErrorBoundary>
          <Suspense fallback={<ArchivistLoadingPlaceholder />}>
            <Canvas
              shadows="percentage"
              dpr={[1, 1.75]}
              frameloop={isActive ? 'always' : 'demand'}
              camera={{ position: [0.0, 0.56, 5.2], fov: 35, near: 0.1, far: 40 }}
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
              {/* Studio Warm Editorial Lighting */}
              <ambientLight intensity={0.78} color="#FFFDF9" />
              <hemisphereLight args={['#FFFDF8', '#E2E8E6', 0.95]} />
              <directionalLight
                position={[3.2, 5.2, 4.0]}
                intensity={1.6}
                color="#FFF9F0"
                castShadow={!reducedMotion}
                shadow-mapSize-width={512}
                shadow-mapSize-height={512}
                shadow-camera-near={1}
                shadow-camera-far={14}
                shadow-camera-left={-3.5}
                shadow-camera-right={3.5}
                shadow-camera-top={3.0}
                shadow-camera-bottom={-2.2}
                shadow-bias={-0.0005}
                shadow-normalBias={0.02}
              />
              <directionalLight
                position={[-3.8, 2.6, -2.0]}
                intensity={0.8}
                color="#FED7AA"
              />
              <directionalLight
                position={[0, -2.0, 2.0]}
                intensity={0.25}
                color="#E7E5E4"
              />

              <CareerArchivistScene
                isActive={isActive}
                reducedMotion={reducedMotion}
                containerRef={containerRef}
              />

              {/* Dynamic Ground Contact Shadow — exact original parameters restored */}
              <ContactShadows
                position={[0, -0.785, 0]}
                opacity={0.34}
                scale={6.5}
                blur={2.0}
                far={2.8}
                resolution={256}
                color="#374151"
                frames={reducedMotion ? 1 : Infinity}
              />
            </Canvas>
          </Suspense>
        </MonsterErrorBoundary>
      </div>
    </div>
  );
};

export default CareerArchivistCanvas;
