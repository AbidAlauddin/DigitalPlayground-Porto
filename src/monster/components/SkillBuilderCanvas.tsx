import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import { SkillBuilderScene } from './SkillBuilderScene';
import { HeroMonsterFallback, MonsterErrorBoundary } from './HeroMonsterFallback';

interface SkillBuilderCanvasProps {
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

const BuilderLoadingPlaceholder: React.FC = () => (
  <div
    className="absolute inset-0 flex items-center justify-center pointer-events-none"
    aria-hidden="true"
  >
    <div className="w-16 h-16 rounded-full border-2 border-stone-200 border-t-teal-700/60 animate-spin" />
  </div>
);

export const SkillBuilderCanvas: React.FC<SkillBuilderCanvasProps> = ({
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
        <HeroMonsterFallback message="Skill builder standby" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center justify-center select-none ${className}`}
      aria-label="Interactive 3D fluffy monster pushing technology blocks"
      role="img"
    >
      {/* Minimalist subtle horizontal floor track accent under the builder */}
      <div
        className="pointer-events-none absolute bottom-[12%] left-[6%] right-[6%] h-[1px] bg-stone-200/90"
        aria-hidden="true"
      />
      <span
        className="pointer-events-none absolute bottom-[12%] left-[6%] -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-teal-700/35"
        aria-hidden="true"
      />
      <span
        className="pointer-events-none absolute bottom-[12%] right-[6%] -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-amber-500/45"
        aria-hidden="true"
      />

      <MonsterErrorBoundary>
        <Suspense fallback={<BuilderLoadingPlaceholder />}>
          <Canvas
            shadows="percentage"
            dpr={[1, 1.75]}
            frameloop={isActive ? 'always' : 'demand'}
            camera={{ position: [0.08, 0.45, 6.7], fov: 35.5, near: 0.1, far: 50 }}
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
            <ambientLight intensity={0.76} color="#FFFDF9" />
            <hemisphereLight args={['#FFFDF8', '#E2E8E6', 0.92]} />
            <directionalLight
              position={[3.5, 5.5, 4.5]}
              intensity={1.55}
              color="#FFF9F0"
              castShadow={!reducedMotion}
              shadow-mapSize-width={512}
              shadow-mapSize-height={512}
              shadow-camera-near={1}
              shadow-camera-far={16}
              shadow-camera-left={-4.6}
              shadow-camera-right={4.6}
              shadow-camera-top={3.2}
              shadow-camera-bottom={-2.5}
              shadow-bias={-0.0005}
              shadow-normalBias={0.02}
            />
            <directionalLight
              position={[-4.0, 2.5, -2.5]}
              intensity={0.85}
              color="#FED7AA"
            />
            <directionalLight
              position={[0, -2.0, 2.5]}
              intensity={0.3}
              color="#E7E5E4"
            />

            <SkillBuilderScene
              isActive={isActive}
              reducedMotion={reducedMotion}
              containerRef={containerRef}
            />

            {/* Real-time dynamic ground shadows tracking monster, carried block, and stacked pyramid */}
            <ContactShadows
              position={[0, -1.165, 0]}
              opacity={0.36}
              scale={8.8}
              blur={2.2}
              far={3.4}
              resolution={256}
              color="#44403C"
              frames={reducedMotion ? 1 : Infinity}
            />
          </Canvas>
        </Suspense>
      </MonsterErrorBoundary>
    </div>
  );
};

export default SkillBuilderCanvas;
