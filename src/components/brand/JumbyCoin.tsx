'use client';

import React from 'react';

interface JumbyCoinProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_MAP: Record<string, string> = {
  xs: 'w-3.5 h-3.5',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
};

export function JumbyCoin({ size = 'sm', className = '' }: JumbyCoinProps) {
  const sizeClass = SIZE_MAP[size] || size;

  return (
    <img
      src="/images/jumby-coin.png"
      alt="Jumby Coin"
      className={`inline-block object-contain shrink-0 select-none pointer-events-none drop-shadow-sm ${sizeClass} ${className}`}
      draggable={false}
    />
  );
}
