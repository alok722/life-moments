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
      <rect width="32" height="32" rx="7" fill={`url(#${id})`} />
      <text
        x="16"
        y="21.5"
        textAnchor="middle"
        fontFamily="system-ui,-apple-system,sans-serif"
        fontWeight="700"
        fontSize="15"
        fill="white"
        letterSpacing="-0.5"
      >
        LM
      </text>
      <circle cx="26" cy="6" r="2.2" fill="#34d399" opacity="0.9" />
    </svg>
  );
}
