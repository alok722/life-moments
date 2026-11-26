function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  // Set automatically on Vercel deployments.
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

export const siteConfig = {
  name: "Life Moments",
  tagline: "Never miss a moment that matters",
  title: "Life Moments – Birthday & Anniversary Reminders with AI Wishes",
  description:
    "Free reminder app for birthdays, anniversaries, bills and life's important dates. Get timely email reminders, recurring events and AI-written personalised wishes — installable on any phone.",
  url: resolveSiteUrl(),
  github: "https://github.com/alok722/life-moments",
  themeColor: "#7c5cfc",
  keywords: [
    "birthday reminder",
    "anniversary reminder",
    "bill reminder",
    "important dates reminder",
    "AI birthday wishes",
    "email reminders",
    "recurring reminders",
    "PWA reminder app",
    "never forget birthdays",
  ],
} as const;
