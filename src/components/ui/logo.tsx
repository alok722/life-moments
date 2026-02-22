interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 28, className }: LogoProps) {
  const id = `logo-g-${size}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7c5cfc" />
          <stop offset="100%" stopColor="#5b8def" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill={`url(#${id})`} />
      <g fill="white">
        <path d="M6.5 8.5h3.2v11.5h5v2.8H6.5z" />
        <path d="M16 8.5h3.8l2.6 7.5 2.6-7.5H28.8v14.3h-3v-9.2l-2.3 6.6h-2.2l-2.3-6.6v9.2h-3z" />
      </g>
      <circle cx="26.5" cy="6.5" r="2.2" fill="#34d399" opacity="0.9" />
    </svg>
  );
}
