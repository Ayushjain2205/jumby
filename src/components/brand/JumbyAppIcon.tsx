'use client';

import React from 'react';

interface JumbyAppIconProps {
  className?: string;
  size?: number;
}

export function JumbyAppIcon({ className = '', size = 36 }: JumbyAppIconProps) {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative rounded-[26%] bg-jumby-purple shadow-lg shadow-jumby-purple/30 overflow-hidden flex items-center justify-center shrink-0 select-none ${className}`}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Splash Pills from brand swatch top right */}
        {/* Lime (#D8FF43) */}
        <rect
          x="38"
          y="11"
          width="5"
          height="12"
          rx="2.5"
          transform="rotate(32 38 11)"
          fill="#D8FF43"
        />
        {/* Coral (#FF7657) */}
        <rect
          x="48"
          y="18"
          width="4.5"
          height="11"
          rx="2.25"
          transform="rotate(58 48 18)"
          fill="#FF7657"
        />

        {/* Chunky Bubbly "J" */}
        <path
          d="M32 18C35.3137 18 38 20.6863 38 24V37C38 42.5228 33.5228 47 28 47C22.4772 47 18 42.5228 18 37C18 35.3431 19.3431 34 21 34C22.6569 34 24 35.3431 24 37C24 39.2091 25.7909 41 28 41C30.2091 41 32 39.2091 32 37V24C32 20.6863 34.6863 18 32 18Z"
          fill="#FFFFFF"
        />
      </svg>
    </div>
  );
}
