import React from 'react';

interface HeroMonsterFallbackProps {
  message?: string;
}

/**
 * Graceful visual fallback rendered if WebGL is unavailable, context is lost,
 * or the 3D monster asset fails to load.
 */
export const HeroMonsterFallback: React.FC<HeroMonsterFallbackProps> = ({
  message = 'Interactive 3D mascot standby',
}) => {
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center rounded-3xl bg-stone-100/70 border border-stone-200/80 p-6 text-center select-none"
      role="img"
      aria-label="Fluffy monster mascot visual"
    >
      {/* Minimalist stylized fluffy monster silhouette */}
      <svg
        viewBox="0 0 220 220"
        className="w-40 h-40 sm:w-48 sm:h-48 drop-shadow-sm"
        aria-hidden="true"
      >
        <ellipse cx="110" cy="196" rx="54" ry="10" fill="#E7E5E4" />
        {/* Body */}
        <path
          d="M60 155 C52 115, 62 56, 110 56 C158 56, 168 115, 160 155 C156 178, 138 188, 110 188 C82 188, 64 178, 60 155 Z"
          fill="#248F86"
        />
        {/* Belly */}
        <ellipse cx="110" cy="146" rx="30" ry="26" fill="#88D8CF" />
        {/* Face */}
        <ellipse cx="110" cy="96" rx="36" ry="26" fill="#88D8CF" />
        {/* Left & Right Expressive Eyes */}
        <circle cx="94" cy="94" r="11" fill="#FFFFFF" />
        <circle cx="126" cy="94" r="11" fill="#FFFFFF" />
        <circle cx="96" cy="94" r="6" fill="#1C1917" />
        <circle cx="128" cy="94" r="6" fill="#1C1917" />
        <circle cx="98" cy="91" r="2.2" fill="#FFFFFF" />
        <circle cx="130" cy="91" r="2.2" fill="#FFFFFF" />
        {/* Friendly smile */}
        <path
          d="M99 109 Q110 118 121 109"
          fill="none"
          stroke="#115E59"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </svg>
      <span className="mt-3 text-[11px] font-mono uppercase tracking-widest text-stone-400">
        {message}
      </span>
    </div>
  );
};

interface ErrorBoundaryState {
  hasError: boolean;
}

export class MonsterErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn('[HeroMonster] WebGL/Model error caught, showing fallback:', error.message);
  }

  render() {
    if (this.state.hasError) {
      return <HeroMonsterFallback message="3D view unavailable on this device" />;
    }
    return this.props.children;
  }
}
