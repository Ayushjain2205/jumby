'use client';

import React from 'react';

interface JumbyCoinProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_MAP: Record<string, string> = {
  xs: 'h-3.5 w-auto',
  sm: 'h-4.5 w-auto',
  md: 'h-5.5 w-auto',
  lg: 'h-7 w-auto',
  xl: 'h-9 w-auto',
};

export function JumbyCoin({ size = 'sm', className = '' }: JumbyCoinProps) {
  const sizeClass = SIZE_MAP[size] || size;

  return (
    <img
      src="/images/jumby-coin.png"
      alt="Jumby Coin"
      className={`inline-block object-contain shrink-0 select-none pointer-events-none drop-shadow-[0_1px_3px_rgba(255,200,0,0.45)] ${sizeClass} ${className}`}
      draggable={false}
    />
  );
}
