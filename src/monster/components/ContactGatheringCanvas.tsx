import React, { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  ContactGatheringScene,
  type CardBoundsNdc,
  type FocusedContactField,
} from './ContactGatheringScene';
import { HeroMonsterFallback, MonsterErrorBoundary } from './HeroMonsterFallback';

export interface ContactGatheringCanvasProps {
  isActive?: boolean;
  className?: string;
  focusedField: FocusedContactField;
  typingTrigger: number;
  celebrationTrigger: number;
  getCardBoundsNdc: () => CardBoundsNdc | null;
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

export const ContactGatheringCanvas: React.FC<ContactGatheringCanvasProps> = ({
  isActive = true,
  className = '',
  focusedField,
  typingTrigger,
  celebrationTrigger,
  getCardBoundsNdc,
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
        <HeroMonsterFallback message="All monsters gathered behind the contact card" />
      </div>
    );
  }

  return (
    <div
      className={`pointer-events-none select-none overflow-visible ${className}`}
      aria-label="All five 3D monsters peeking cheerfully from behind the Contact card"
      role="img"
    >
      <MonsterErrorBoundary>
        <Suspense fallback={null}>
          <Canvas
            dpr={[1, 1.75]}
            frameloop={isActive ? 'always' : 'demand'}
            camera={{ position: [0.0, 0.0, 4.4], fov: 35, near: 0.1, far: 30 }}
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
            {/* Studio Editorial Lighting matching Sections 01-05 */}
            <ambientLight intensity={0.85} color="#FFFDF9" />
            <hemisphereLight args={['#FFFDF8', '#E2E8E6', 0.95]} />
            <directionalLight
              position={[3.2, 4.8, 4.0]}
              intensity={1.55}
              color="#FFF9F0"
            />
            <directionalLight position={[-3.4, 2.2, -1.8]} intensity={0.75} color="#FED7AA" />
            <directionalLight position={[0, -1.8, 2.2]} intensity={0.28} color="#E7E5E4" />

            <ContactGatheringScene
              isActive={isActive}
              reducedMotion={reducedMotion}
              focusedField={focusedField}
              typingTrigger={typingTrigger}
              celebrationTrigger={celebrationTrigger}
              getCardBoundsNdc={getCardBoundsNdc}
            />
          </Canvas>
        </Suspense>
      </MonsterErrorBoundary>
    </div>
  );
};

export default ContactGatheringCanvas;
