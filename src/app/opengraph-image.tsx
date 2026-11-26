import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const alt = `${siteConfig.name} – ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const pills = ["Birthdays", "Anniversaries", "Bills", "AI wishes"];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px 88px",
          background: "linear-gradient(135deg, #7c5cfc 0%, #5b8def 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <svg width="120" height="120" viewBox="0 0 32 32">
            <defs>
              <linearGradient id="h" x1="10.6" y1="13.5" x2="21.4" y2="23.2" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#f472b6" />
                <stop offset="1" stopColor="#7c5cfc" />
              </linearGradient>
            </defs>
            <rect width="32" height="32" rx="7" fill="rgba(255,255,255,0.16)" />
            <rect x="7" y="9" width="18" height="16" rx="3.5" fill="#ffffff" />
            <rect x="10.5" y="6.5" width="2.4" height="5" rx="1.2" fill="#ffffff" />
            <rect x="19.1" y="6.5" width="2.4" height="5" rx="1.2" fill="#ffffff" />
            <path
              d="M16 23.2C16 23.2 10.6 20 10.6 16.4C10.6 14.7 11.9 13.5 13.4 13.5C14.5 13.5 15.4 14.1 16 15.1C16.6 14.1 17.5 13.5 18.6 13.5C20.1 13.5 21.4 14.7 21.4 16.4C21.4 20 16 23.2 16 23.2Z"
              fill="url(#h)"
            />
            <path d="M26.5 2.6Q27.05 4.95 29.4 5.5Q27.05 6.05 26.5 8.4Q25.95 6.05 23.6 5.5Q25.95 4.95 26.5 2.6Z" fill="#fcd34d" />
          </svg>
          <div style={{ fontSize: 64, fontWeight: 800, letterSpacing: -2 }}>{siteConfig.name}</div>
        </div>
        <div style={{ marginTop: 40, fontSize: 72, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2, maxWidth: 960 }}>
          {`${siteConfig.tagline}.`}
        </div>
        <div style={{ marginTop: 24, fontSize: 32, opacity: 0.9, maxWidth: 940, lineHeight: 1.3 }}>
          Smart reminders for birthdays, anniversaries and bills — with AI-written wishes.
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 44 }}>
          {pills.map((p) => (
            <div
              key={p}
              style={{
                display: "flex",
                padding: "12px 24px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.18)",
                fontSize: 26,
                fontWeight: 600,
              }}
            >
              {p}
            </div>
          ))}
        </div>
      </div>
    ),
    size
  );
}
