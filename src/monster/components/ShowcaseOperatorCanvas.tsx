import React, { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import { ShowcaseOperatorScene, type PaginationTargetNdc } from './ShowcaseOperatorScene';
import { HeroMonsterFallback, MonsterErrorBoundary } from './HeroMonsterFallback';

export interface ShowcaseOperatorCanvasProps {
  isActive?: boolean;
  className?: string;
  stageContainerRef: React.RefObject<HTMLDivElement | null>;
  activeProjectIdx: number;
  manualTriggerVersion: number;
  getPaginationTargets: () => PaginationTargetNdc[];
  getSitAnchorNdcX: () => number;
  onPressButton: (idx: number) => void;
  onPressVisualChange: (idx: number | null) => void;
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

export const ShowcaseOperatorCanvas: React.FC<ShowcaseOperatorCanvasProps> = ({
  isActive = true,
  className = '',
  stageContainerRef,
  activeProjectIdx,
  manualTriggerVersion,
  getPaginationTargets,
  getSitAnchorNdcX,
  onPressButton,
  onPressVisualChange,
}) => {
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
      <div className={`pointer-events-none ${className}`}>
        <HeroMonsterFallback message="Project showcase operator standby" />
      </div>
    );
  }

  return (
    <div
      className={`pointer-events-none select-none overflow-visible ${className}`}
      aria-label="Interactive 3D Showcase Operator Monster controlling project pagination"
      role="img"
    >
      <MonsterErrorBoundary>
        <Suspense fallback={null}>
          <Canvas
            shadows="percentage"
            dpr={[1, 1.75]}
            frameloop={isActive ? 'always' : 'demand'}
            camera={{ position: [0.0, -0.05, 4.15], fov: 35, near: 0.1, far: 30 }}
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
            className="w-full h-full pointer-events-none"
          >
            {/* Studio Editorial Lighting matching Home, About, Skills, Experience */}
            <ambientLight intensity={0.82} color="#FFFDF9" />
            <hemisphereLight args={['#FFFDF8', '#E2E8E6', 0.95]} />
            <directionalLight
              position={[3.0, 4.8, 3.8]}
              intensity={1.55}
              color="#FFF9F0"
              castShadow={!reducedMotion}
              shadow-mapSize-width={512}
              shadow-mapSize-height={512}
              shadow-camera-near={1}
              shadow-camera-far={12}
              shadow-camera-left={-3.0}
              shadow-camera-right={3.0}
              shadow-camera-top={2.5}
              shadow-camera-bottom={-2.0}
              shadow-bias={-0.0005}
              shadow-normalBias={0.02}
            />
            <directionalLight position={[-3.4, 2.2, -1.8]} intensity={0.75} color="#FED7AA" />
            <directionalLight position={[0, -1.8, 2.0]} intensity={0.25} color="#E7E5E4" />

            <ShowcaseOperatorScene
              isActive={isActive}
              reducedMotion={reducedMotion}
              stageContainerRef={stageContainerRef}
              activeProjectIdx={activeProjectIdx}
              manualTriggerVersion={manualTriggerVersion}
              getPaginationTargets={getPaginationTargets}
              getSitAnchorNdcX={getSitAnchorNdcX}
              onPressButton={onPressButton}
              onPressVisualChange={onPressVisualChange}
            />

            {/* Grounded Contact Shadows following the operator from sitting anchor across all pagination buttons */}
            <ContactShadows
              position={[0, -0.825, 0]}
              opacity={0.32}
              scale={6.5}
              blur={2.1}
              far={2.6}
              resolution={256}
              color="#374151"
              frames={reducedMotion ? 1 : Infinity}
            />
          </Canvas>
        </Suspense>
      </MonsterErrorBoundary>
    </div>
  );
};

export default ShowcaseOperatorCanvas;
