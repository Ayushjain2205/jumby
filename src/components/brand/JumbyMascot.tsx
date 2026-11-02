'use client';

import React from 'react';

interface JumbyMascotProps {
  className?: string;
  size?: number;
}

export function JumbyMascot({ className = '', size = 120 }: JumbyMascotProps) {
  return (
    <div style={{ width: size, height: size }} className={`relative select-none ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 140 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Glow */}
        <circle cx="70" cy="75" r="55" fill="#7160FF" fillOpacity="0.25" filter="blur(16px)" />

        {/* Crown / Top Spikes (Lime, Coral, Sky) */}
        <path d="M56 32L62 44H50L56 32Z" fill="#D8FF43" />
        <path d="M70 26L77 42H63L70 26Z" fill="#FF7657" />
        <path d="M84 32L90 44H78L84 32Z" fill="#4DB8FF" />

        {/* Cube Head & Body (Jumby Purple #7160FF) */}
        <rect x="36" y="42" width="68" height="60" rx="22" fill="#7160FF" />
        {/* Head Highlight */}
        <rect x="42" y="46" width="56" height="12" rx="6" fill="#8B7DFF" />

        {/* Big expressive cute eyes */}
        <ellipse cx="56" cy="70" rx="6" ry="8" fill="#0F0F0F" />
        <ellipse cx="84" cy="70" rx="6" ry="8" fill="#0F0F0F" />
        {/* Eye sparkles */}
        <circle cx="58" cy="67" r="2.5" fill="#FFFFFF" />
        <circle cx="86" cy="67" r="2.5" fill="#FFFFFF" />

        {/* Cute happy blush cheeks (Jumby Coral) */}
        <circle cx="46" cy="76" r="4" fill="#FF7657" fillOpacity="0.8" />
        <circle cx="94" cy="76" r="4" fill="#FF7657" fillOpacity="0.8" />

        {/* Smile */}
        <path d="M64 78C67 82 73 82 76 78" stroke="#0F0F0F" strokeWidth="3" strokeLinecap="round" />

        {/* Little Body & Feet */}
        <rect x="52" y="98" width="36" height="24" rx="12" fill="#5845EE" />
        <ellipse cx="54" cy="122" rx="9" ry="6" fill="#4130D0" />
        <ellipse cx="86" cy="122" rx="9" ry="6" fill="#4130D0" />

        {/* Golden Creator Pencil in Hand */}
        <g transform="rotate(35 98 85)">
          <rect x="94" y="55" width="8" height="34" rx="2" fill="#D8FF43" />
          <polygon points="94,89 102,89 98,98" fill="#FF7657" />
          <polygon points="97,95 99,95 98,98" fill="#0F0F0F" />
          <rect x="94" y="52" width="8" height="5" rx="1" fill="#4DB8FF" />
        </g>
      </svg>
    </div>
  );
}
