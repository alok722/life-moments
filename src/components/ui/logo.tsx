import { useId } from "react";

interface LogoProps {
  size?: number;
  className?: string;
  title?: string;
}

/**
 * Life Moments mark: a calendar page with a heart and a sparkle.
 * Keep in sync with scripts/generate-icons.mjs.
 */
export function Logo({ size = 28, className, title = "Life Moments" }: LogoProps) {
  const uid = useId();
  const bg = `lm-bg-${uid}`;
  const heart = `lm-heart-${uid}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={title}
    >
      <defs>
        <linearGradient id={bg} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#7c5cfc" />
          <stop offset="1" stopColor="#5b8def" />
        </linearGradient>
        <linearGradient id={heart} x1="10.6" y1="13.5" x2="21.4" y2="23.2" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f472b6" />
          <stop offset="1" stopColor="#7c5cfc" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="7" fill={`url(#${bg})`} />
      <rect x="7" y="9" width="18" height="16" rx="3.5" fill="#ffffff" />
      <rect x="10.5" y="6.5" width="2.4" height="5" rx="1.2" fill="#ffffff" stroke={`url(#${bg})`} strokeWidth="0.9" />
      <rect x="19.1" y="6.5" width="2.4" height="5" rx="1.2" fill="#ffffff" stroke={`url(#${bg})`} strokeWidth="0.9" />
      <path
        d="M16 23.2C16 23.2 10.6 20 10.6 16.4C10.6 14.7 11.9 13.5 13.4 13.5C14.5 13.5 15.4 14.1 16 15.1C16.6 14.1 17.5 13.5 18.6 13.5C20.1 13.5 21.4 14.7 21.4 16.4C21.4 20 16 23.2 16 23.2Z"
        fill={`url(#${heart})`}
      />
      <path d="M26.5 2.6Q27.05 4.95 29.4 5.5Q27.05 6.05 26.5 8.4Q25.95 6.05 23.6 5.5Q25.95 4.95 26.5 2.6Z" fill="#fcd34d" />
    </svg>
  );
}
