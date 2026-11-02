'use client';

import React from 'react';

interface JumbyLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'white' | 'purple' | 'black';
  showSubtitle?: boolean;
}

export function JumbyLogo({
  className = '',
  size = 'md',
  variant = 'white',
  showSubtitle = false,
}: JumbyLogoProps) {
  const textColor = variant === 'white' ? '#FFFFFF' : variant === 'purple' ? '#7160FF' : '#0F0F0F';

  const dimensions = {
    sm: { width: 90, height: 32, fontSize: 24 },
    md: { width: 130, height: 46, fontSize: 34 },
    lg: { width: 180, height: 64, fontSize: 48 },
  }[size];

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <svg
        width={dimensions.width}
        height={dimensions.height}
        viewBox="0 0 160 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        {/* 4 Brand Swatch Splash Pills above the 'u' and 'm' */}
        {/* 1. Purple (#7160FF) */}
        <rect
          x="62"
          y="4"
          width="7"
          height="14"
          rx="3.5"
          transform="rotate(-26 62 4)"
          fill="#7160FF"
        />
        {/* 2. Lime (#D8FF43) */}
        <rect
          x="78"
          y="0"
          width="7.5"
          height="16"
          rx="3.75"
          transform="rotate(-8 78 0)"
          fill="#D8FF43"
        />
        {/* 3. Coral (#FF7657) */}
        <rect
          x="94"
          y="2"
          width="7"
          height="15"
          rx="3.5"
          transform="rotate(14 94 2)"
          fill="#FF7657"
        />
        {/* 4. Sky (#4DB8FF) */}
        <rect
          x="108"
          y="7"
          width="6.5"
          height="13"
          rx="3.25"
          transform="rotate(32 108 7)"
          fill="#4DB8FF"
        />

        {/* Jumby Bubbly Wordmark */}
        <text
          x="4"
          y="48"
          fill={textColor}
          fontFamily="var(--font-poppins), Poppins, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="42"
          letterSpacing="-1.5"
        >
          Jumby
        </text>

        {/* Small TM mark */}
        <text
          x="148"
          y="24"
          fill={textColor}
          opacity="0.6"
          fontFamily="sans-serif"
          fontWeight="700"
          fontSize="9"
        >
          TM
        </text>
      </svg>

      {showSubtitle && (
        <span className="text-[9px] font-black tracking-[0.25em] text-zinc-400 mt-1 uppercase">
          PLAY • CREATE • SHARE • TOGETHER
        </span>
      )}
    </div>
  );
}
