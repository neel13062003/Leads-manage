type P = { size?: number };

export const Facebook = ({ size = 16 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M13.5 22v-8.2h2.8l.5-3.3h-3.3V8.4c0-.9.4-1.7 1.8-1.7h1.6V3.8S15.600 3.500 14.400 3.500c-2.600 0-4.200 1.500-4.200 4.300v2.700H7.500v3.300h2.700V22z" />
  </svg>
);

export const Instagram = ({ size = 16 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.500" cy="6.500" r="0.800" fill="currentColor" />
  </svg>
);
