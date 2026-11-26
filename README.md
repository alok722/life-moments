<p align="center"><img src="public/logo.svg" alt="Life Moments" width="360"></p>

# Life Moments

> Never miss a moment that matters. ✨

**🌐 Live app: [mylifemoments.vercel.app](https://mylifemoments.vercel.app)**

An open-source, mobile-first reminder web app for tracking birthdays 🎂, anniversaries 💍, bills 📄, and custom events. Get smart email reminders with AI-written messages for birthdays and anniversaries, plus an optional daily AI news digest — all from a beautiful, installable PWA.

## Features

- **Passwordless Auth** — Magic link sign-in via Supabase Auth 🔐
- **Smart Reminders** — Schedule notifications 1 hour to 1 week before events, or on the day ⏰
- **Recurring Events** — Daily, weekly, monthly, or yearly recurrence 🔁
- **Email Notifications** — Automated email reminders via Brevo (runs every 15 min via Supabase cron) 📧
- **AI Message Ideas** — for birthdays and anniversaries, Gemini writes 3 ready-to-send messages tuned to the relationship (heartfelt/playful for family & friends, professional for colleagues, respectful for in-laws), personalised from your notes. Shown in the app and in the reminder email with one-tap WhatsApp sharing; falls back to hand-written templates if the AI is unavailable 🤖
- **Daily AI News** — pick the "AI News" event type to get one email every morning at 7:00 AM IST with the day's top AI stories from Hacker News, TechCrunch, MIT Technology Review and The Verge, each with a short AI summary and link (built once per day and cached) 📰
- **Relationship Tagging** — Tag reminders by relationship (Parent, Mother, Friend, Colleague, etc.) 👥
- **PWA** — Installable on iOS/Android with offline shell caching via service worker 📱
- **Dark Mode** — System-aware theme toggle (light/dark) 🌙
- **Mobile-First** — Optimized for 375px+ screens with swipe-to-delete and thumb-friendly layout 📲
- **Shared Notifications** — Add up to 5 extra email recipients to receive all your reminder notifications 👨‍👩‍👧‍👦
- **Floating Action Button** — Context-aware FAB for quick reminder creation ➕

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4, shadcn/ui |
| Auth | Supabase Auth (magic link) |
| Database | Supabase PostgreSQL + Row Level Security |
| Email | Brevo (formerly Sendinblue) SMTP API |
| AI | Google Gemini 2.5 Flash |
| Deployment | Vercel (frontend) + Supabase (backend + edge functions) |

## Getting Started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- A [Brevo](https://brevo.com) account (free tier: 300 emails/day)
- A [Google AI Studio](https://aistudio.google.com) API key

### 1. Clone and install 📦

```bash
git clone https://github.com/alok722/life-moments.git
cd life-moments
npm install
```

### 2. Set up environment variables 🔑

```bash
cp .env.example .env.local
```

Fill in your values:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |
| `GOOGLE_GEMINI_API_KEY` | Google Gemini API key |
| `BREVO_API_KEY` | Your Brevo API key |
| `BREVO_SENDER_EMAIL` | Verified sender email in Brevo |
| `BREVO_SENDER_NAME` | Sender display name (e.g. `Life Moments`) |
| `NEXT_PUBLIC_SITE_URL` | Public URL used for canonical links, Open Graph, `robots.txt` and `sitemap.xml` (falls back to the Vercel production URL) |

### 3. Set up Supabase 🗄️

1. Go to your Supabase project's SQL Editor
2. Run every file in `supabase/migrations/` in order (`001` … `008`), or `supabase db push`. `006_harden_sending.sql` adds the DB-enforced recipient cap, client write guards, send log and retry bookkeeping used by `send-reminders`
3. Enable the `pg_net` and `pg_cron` extensions in the Supabase dashboard (Database > Extensions)
4. Run the cron setup from `supabase/migrations/002_create_cron.sql` (update the URL and service role key). `send-reminders` rejects calls without `Authorization: Bearer <service role key>` (or an `x-cron-secret` header matching the optional `CRON_SECRET` function secret)

### 4. Deploy Edge Functions ☁️

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Set secrets
supabase secrets set BREVO_API_KEY=xkeysib-xxxxx
supabase secrets set BREVO_SENDER_EMAIL=you@example.com
supabase secrets set BREVO_SENDER_NAME="Life Moments"
supabase secrets set GOOGLE_GEMINI_API_KEY=AIxxxxx

# Deploy
supabase functions deploy send-reminders
```

### 5. Run locally 🚀

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 6. Generate icons 🎨

```bash
npm run generate-icons
```

Builds every icon (favicon SVG/ICO/PNG, PWA icons, maskable icon, Apple touch icon, `public/logo.svg` lockup) from the single logo mark defined in the script, using `sharp`. Keep `src/components/ui/logo.tsx` in sync if you change the mark.

### 7. Deploy to Vercel 🌐

1. Push to GitHub
2. Import in [Vercel](https://vercel.com)
3. Set environment variables in Vercel dashboard
4. Deploy

## Project Structure 📁

```
src/
  app/
    (auth)/           # Login/signup pages + auth callback
    (protected)/      # Dashboard, settings + reminder CRUD (requires auth)
    api/              # API routes (AI wish generator)
  components/
    ui/               # shadcn/ui components
    reminders/        # Reminder-specific components (form, list, cards)
    settings/         # Notification recipient management
    layout/           # Nav, FAB, theme toggle
    auth/             # Magic link form
    landing/          # Landing page
  lib/
    supabase/         # Client/server/middleware helpers
    validations.ts    # Zod schemas
    constants.ts      # Event types, relations, reminder offsets
    utils.ts          # Helpers (date computation, cn)
  types/              # TypeScript types
  hooks/              # Custom React hooks

supabase/
  migrations/         # SQL migrations
  functions/          # Edge Functions (send-reminders) + _shared scheduler

scripts/
  generate-icons.mjs  # SVG → PNG/ICO icon generation
```

## Brevo Email Configuration 📬

1. Create a free account at [brevo.com](https://brevo.com)
2. Go to **Settings > Senders, Domains & Dedicated IPs > Senders**
3. Add and verify your sender email address (Brevo sends a confirmation link)
4. Generate an API key from **Settings > SMTP & API > API Keys**
5. Set the secrets in Supabase:
   ```bash
   supabase secrets set BREVO_API_KEY=xkeysib-xxxxx
   supabase secrets set BREVO_SENDER_EMAIL=your-verified-email@example.com
   supabase secrets set BREVO_SENDER_NAME="Life Moments"
   ```
6. (Optional) For better deliverability, verify your domain in Brevo by adding SPF/DKIM DNS records

> **Note:** Brevo's free tier allows 300 emails/day with no recipient restrictions — you can send to any email address once your sender is verified.

## Contributing 🤝

Contributions are welcome! Feel free to open issues or submit pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License 📄

MIT
