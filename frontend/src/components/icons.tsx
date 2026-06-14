import React from 'react';

type P = { className?: string; size?: number };
const base = (size = 18) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export const Shield = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M12 3l7 3v5c0 4.4-3 8-7 9-4-1-7-4.6-7-9V6z" />
    <path d="M9.5 12l1.8 1.8L15 10.2" />
  </svg>
);
export const Heart = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M12 20s-7-4.3-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.7-7 9-7 9Z" />
  </svg>
);
export const Bag = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M6 7h12l-1 12H7zM9 7a3 3 0 0 1 6 0" />
  </svg>
);
export const Search = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4-4" />
  </svg>
);
export const Check = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M20 6L9 17l-5-5" />
  </svg>
);
export const Back = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M15 18l-6-6 6-6" />
  </svg>
);
export const Lock = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);
export const Loop = ({ className, size = 20 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" className={className}>
    <path d="M7 8a5 5 0 1 0 5 5 5 5 0 0 1 5-5 5 5 0 1 1-5 5 5 5 0 0 0-5-5Z" />
  </svg>
);
