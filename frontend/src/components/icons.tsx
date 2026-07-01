import React from 'react';
type P = { className?: string; size?: number };
const b = (size = 18) => ({ width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const });

export const Shield = ({ className, size }: P) => (<svg {...b(size)} className={className}><path d="M12 3l7 3v5c0 4.4-3 8-7 9-4-1-7-4.6-7-9V6z" /><path d="M9.4 12l1.8 1.8L15 10.1" /></svg>);
export const ShieldLock = ({ className, size }: P) => (<svg {...b(size)} className={className}><path d="M12 3l7 3v5c0 4.4-3 8-7 9-4-1-7-4.6-7-9V6z" /><rect x="9.3" y="11" width="5.4" height="4.2" rx="1" /><path d="M10.4 11V9.8a1.6 1.6 0 0 1 3.2 0V11" /></svg>);
export const Heart = ({ className, size }: P) => (<svg {...b(size)} className={className}><path d="M12 20s-7-4.3-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.7-7 9-7 9Z" /></svg>);
export const Bag = ({ className, size }: P) => (<svg {...b(size)} className={className}><path d="M6 7h12l-1 12H7zM9 7a3 3 0 0 1 6 0" /></svg>);
export const Search = ({ className, size }: P) => (<svg {...b(size)} className={className}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>);
export const Check = ({ className, size }: P) => (<svg {...b(size)} className={className}><path d="M20 6L9 17l-5-5" /></svg>);
export const Back = ({ className, size }: P) => (<svg {...b(size)} className={className}><path d="M15 18l-6-6 6-6" /></svg>);
export const ArrowRight = ({ className, size }: P) => (<svg {...b(size)} className={className}><path d="M5 12h14M13 6l6 6-6 6" /></svg>);
export const Lock = ({ className, size }: P) => (<svg {...b(size)} className={className}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>);
export const Bolt = ({ className, size }: P) => (<svg {...b(size)} className={className}><path d="M13 3L4 14h7l-1 7 9-11h-7z" /></svg>);
export const Truck = ({ className, size }: P) => (<svg {...b(size)} className={className}><path d="M3 7h11v8H3zM14 10h4l3 3v2h-7z" /><circle cx="7" cy="18" r="1.6" /><circle cx="17.5" cy="18" r="1.6" /></svg>);
export const Tag = ({ className, size }: P) => (<svg {...b(size)} className={className}><path d="M3 12l9-9 9 9-9 9z" /><circle cx="9" cy="9" r="1.2" fill="currentColor" stroke="none" /></svg>);
export const Clock = ({ className, size }: P) => (<svg {...b(size)} className={className}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>);
export const Share = ({ className, size }: P) => (<svg {...b(size)} className={className}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" /></svg>);
export const Plus = ({ className, size }: P) => (<svg {...b(size)} className={className}><path d="M12 5v14M5 12h14" /></svg>);
export const Camera = ({ className, size }: P) => (<svg {...b(size)} className={className}><path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L19 6h0a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><circle cx="12" cy="12.5" r="3.2" /></svg>);
export const Store = ({ className, size }: P) => (<svg {...b(size)} className={className}><path d="M4 9l1-4h14l1 4M4 9v10h16V9M4 9h16M9 19v-5h6v5" /></svg>);
export const Wallet = ({ className, size }: P) => (<svg {...b(size)} className={className}><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M16 12h2" /></svg>);
export const Bell = ({ className, size }: P) => (<svg {...b(size)} className={className}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>);
export const Star = ({ className, size }: P) => (<svg {...b(size)} className={className} fill="currentColor" stroke="none"><path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.2l1-5.8L3.5 9.2l5.9-.9z" /></svg>);
export const Verified = ({ className, size }: P) => (<svg {...b(size)} className={className}><path d="M12 2l2.2 1.6 2.7-.2 1 2.5 2.2 1.5-.6 2.6.6 2.6-2.2 1.5-1 2.5-2.7-.2L12 22l-2.2-1.6-2.7.2-1-2.5L3.9 16l.6-2.6L3.9 11l2.2-1.5 1-2.5 2.7.2z" /><path d="M9 12l2 2 4-4" /></svg>);
// Loopy brand mark — four rounded modular tiles whose inner corners point to the
// centre (a "connected ecosystem"). Filled with currentColor so it inherits color.
export const Loop = ({ className, size = 20 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" className={className}>
    <path d="M5.5 2.5 H8 A3 3 0 0 1 11 5.5 V10.2 A0.8 0.8 0 0 1 10.2 11 H5.5 A3 3 0 0 1 2.5 8 V5.5 A3 3 0 0 1 5.5 2.5 Z" />
    <path d="M16 2.5 H18.5 A3 3 0 0 1 21.5 5.5 V8 A3 3 0 0 1 18.5 11 H13.8 A0.8 0.8 0 0 1 13 10.2 V5.5 A3 3 0 0 1 16 2.5 Z" />
    <path d="M5.5 13 H10.2 A0.8 0.8 0 0 1 11 13.8 V18.5 A3 3 0 0 1 8 21.5 H5.5 A3 3 0 0 1 2.5 18.5 V16 A3 3 0 0 1 5.5 13 Z" />
    <path d="M13.8 13 H18.5 A3 3 0 0 1 21.5 16 V18.5 A3 3 0 0 1 18.5 21.5 H16 A3 3 0 0 1 13 18.5 V13.8 A0.8 0.8 0 0 1 13.8 13 Z" />
  </svg>
);
export const Sparkle = ({ className, size }: P) => (<svg {...b(size)} className={className}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.5 6.5l2.5 2.5M15 15l2.5 2.5M17.5 6.5L15 9M9 15l-2.5 2.5" /></svg>);
export const Grid = ({ className, size }: P) => (<svg {...b(size)} className={className}><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></svg>);
export const Users = ({ className, size }: P) => (<svg {...b(size)} className={className}><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0" /><path d="M16 5.2a3.2 3.2 0 0 1 0 6M17.5 19a5.5 5.5 0 0 0-2.3-4.5" /></svg>);
export const Cog = ({ className, size }: P) => (<svg {...b(size)} className={className}><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></svg>);
export const LogOut = ({ className, size }: P) => (<svg {...b(size)} className={className}><path d="M15 4h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3" /><path d="M10 17l-5-5 5-5M5 12h11" /></svg>);
export const Chart = ({ className, size }: P) => (<svg {...b(size)} className={className}><path d="M4 19V5M4 19h16" /><path d="M8 16v-4M12 16V8M16 16v-6" /></svg>);
export const Eye = ({ className, size }: P) => (<svg {...b(size)} className={className}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>);
export const MessageDots = ({ className, size }: P) => (<svg {...b(size)} className={className}><path d="M21 11.5a8.4 8.4 0 0 1-11.9 7.6L3 21l1.9-6.1A8.4 8.4 0 1 1 21 11.5Z" /><path d="M8 12h.01M12 12h.01M16 12h.01" /></svg>);
