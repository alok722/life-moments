# Life Moments

A mobile-first reminder web app. Never miss a moment that matters.

Built with Next.js (App Router), Supabase, Resend, and Google Gemini.

## Features

- **Magic Link Auth** — passwordless sign-in via email
- **CRUD Reminders** — create, edit, delete reminders with date pickers and recurrence
- **Dashboard** — Today / This Week / This Month tabs with search and type filters
- **Email Reminders** — Supabase cron triggers an Edge Function every 15 min to send pending reminders via Resend
- **AI Wish Generator** — Gemini-powered wish suggestions for birthdays, anniversaries, etc.
- **PWA** — installable on iOS/Android with offline shell caching
- **Dark Mode** — system-aware theme toggle
- **Mobile-First** — optimized for 375px+ screens with swipe-to-delete and thumb-friendly layout

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS v4, shadcn/ui |
| Auth | Supabase Auth (magic link) |
| Database | Supabase PostgreSQL + RLS |
| Email | Resend API |
| AI | Google Gemini 2.0 Flash |
| Deployment | Vercel (frontend) + Supabase (backend) |

## Getting Started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- A [Resend](https://resend.com) account
- A [Google AI Studio](https://aistudio.google.com) API key

### 1. Clone and install

```bash
git clone <your-repo-url>
cd life-moments
npm install
```

### 2. Set up environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |
| `GOOGLE_GEMINI_API_KEY` | Google Gemini API key |

### 3. Set up Supabase

1. Go to your Supabase project's SQL Editor
2. Run `supabase/migrations/001_create_reminders.sql` to create the table, indexes, and RLS policies
3. Enable the `pg_net` and `pg_cron` extensions in the Supabase dashboard (Database > Extensions)
4. Run the cron setup from `supabase/migrations/002_create_cron.sql` (update the URL and service role key)

### 4. Deploy Edge Functions

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Set secrets
supabase secrets set RESEND_API_KEY=re_xxxxx
supabase secrets set GOOGLE_GEMINI_API_KEY=AIxxxxx

# Deploy
supabase functions deploy send-reminders
supabase functions deploy generate-wish
```

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 6. Deploy to Vercel

1. Push to GitHub
2. Import in [Vercel](https://vercel.com)
3. Set environment variables in Vercel dashboard
4. Deploy

## Project Structure

```
src/
  app/
    (auth)/           # Login/signup pages + auth callback
    (protected)/      # Dashboard + reminder CRUD (requires auth)
    api/              # Vercel API routes (AI wish generator)
  components/
    ui/               # shadcn/ui components
    reminders/        # Reminder-specific components
    layout/           # Nav, bottom button, theme toggle
    auth/             # Magic link form
  lib/
    supabase/         # Client/server/middleware helpers
    validations.ts    # Zod schemas
    constants.ts      # Event types, icons
  types/              # TypeScript types
  hooks/              # Custom React hooks

supabase/
  migrations/         # SQL migrations
  functions/          # Edge Functions (send-reminders, generate-wish)
```

## Resend Configuration

1. Create a Resend account at [resend.com](https://resend.com)
2. Verify your domain (or use the default `onboarding@resend.dev` for testing)
3. Create an API key
4. Store it as a Supabase secret: `supabase secrets set RESEND_API_KEY=re_xxxxx`
5. Update the `from` address in `supabase/functions/send-reminders/index.ts`

## License

MIT
