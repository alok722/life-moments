"use client";

import { motion, type Variants } from "framer-motion";
import Link from "next/link";
import {
  Bell,
  CalendarHeart,
  Clock,
  Gift,
  Heart,
  Mail,
  Repeat,
  Shield,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const features = [
  {
    icon: Bell,
    title: "Smart Reminders",
    description:
      "Get notified hours, days, or weeks before important events. Never miss a birthday or anniversary again.",
  },
  {
    icon: Sparkles,
    title: "AI-Powered Wishes",
    description:
      "Generate heartfelt, personalized wishes for any occasion with the power of AI.",
  },
  {
    icon: Repeat,
    title: "Recurring Events",
    description:
      "Set it once and forget it. Yearly birthdays, monthly bills — they all repeat automatically.",
  },
  {
    icon: Mail,
    title: "Email Notifications",
    description:
      "Receive timely email reminders so you're always prepared, even when you're not in the app.",
  },
  {
    icon: Users,
    title: "Relationship Tracking",
    description:
      "Tag events by relationship — Mother, Friend, Colleague — and keep every connection meaningful.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description:
      "Your data is encrypted and stored securely. Only you can access your moments.",
  },
];

const eventTypes = [
  { icon: "🎂", label: "Birthdays", color: "from-pink-500 to-rose-500" },
  { icon: "💍", label: "Anniversaries", color: "from-violet-500 to-purple-500" },
  { icon: "💳", label: "Bills & Payments", color: "from-blue-500 to-cyan-500" },
  { icon: "📌", label: "Custom Events", color: "from-emerald-500 to-teal-500" },
];

interface LandingPageProps {
  isLoggedIn: boolean;
}

export function LandingPage({ isLoggedIn }: LandingPageProps) {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-background via-background to-violet-50/50 dark:to-violet-950/10">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo size={28} className="shrink-0" />
            <span className="text-lg font-semibold tracking-tight bg-gradient-to-r from-violet-600 to-blue-500 bg-clip-text text-transparent dark:from-violet-400 dark:to-blue-300">
              Life Moments
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {isLoggedIn ? (
              <Button asChild size="sm" className="bg-gradient-to-r from-violet-600 to-blue-500 text-white hover:from-violet-700 hover:to-blue-600 dark:from-violet-500 dark:to-blue-400">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <Button asChild size="sm" className="bg-gradient-to-r from-violet-600 to-blue-500 text-white hover:from-violet-700 hover:to-blue-600 dark:from-violet-500 dark:to-blue-400">
                <Link href="/login">Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-16 pt-16 sm:pb-24 sm:pt-24">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-r from-violet-400/20 to-blue-400/20 blur-3xl dark:from-violet-600/10 dark:to-blue-600/10" />
        </div>

        <div className="relative mx-auto max-w-3xl text-center">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-sm font-medium text-violet-700 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-300"
          >
            <Heart className="h-3.5 w-3.5" />
            Never miss a moment that matters
          </motion.div>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
            className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl"
          >
            Remember Every{" "}
            <span className="bg-gradient-to-r from-violet-600 via-blue-500 to-violet-600 bg-clip-text text-transparent dark:from-violet-400 dark:via-blue-300 dark:to-violet-400">
              Life Moment
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
            className="mx-auto mt-6 max-w-xl text-base text-muted-foreground sm:text-lg"
          >
            The simplest way to track birthdays, anniversaries, and important
            dates. Get smart reminders, AI-generated wishes, and never forget
            the people who matter most.
          </motion.p>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={3}
            className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
          >
            {isLoggedIn ? (
              <Button
                asChild
                size="lg"
                className="w-full bg-gradient-to-r from-violet-600 to-blue-500 text-white shadow-lg shadow-violet-500/25 hover:from-violet-700 hover:to-blue-600 dark:from-violet-500 dark:to-blue-400 dark:shadow-violet-500/15 sm:w-auto"
              >
                <Link href="/dashboard">
                  <Zap className="mr-2 h-4 w-4" />
                  Go to Dashboard
                </Link>
              </Button>
            ) : (
              <Button
                asChild
                size="lg"
                className="w-full bg-gradient-to-r from-violet-600 to-blue-500 text-white shadow-lg shadow-violet-500/25 hover:from-violet-700 hover:to-blue-600 dark:from-violet-500 dark:to-blue-400 dark:shadow-violet-500/15 sm:w-auto"
              >
                <Link href="/login">
                  <Zap className="mr-2 h-4 w-4" />
                  Get Started Free
                </Link>
              </Button>
            )}
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full border-violet-200 dark:border-violet-800 sm:w-auto"
            >
              <a href="#features">
                <CalendarHeart className="mr-2 h-4 w-4" />
                See Features
              </a>
            </Button>
          </motion.div>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={4}
            className="mt-4 text-xs text-muted-foreground"
          >
            Free forever. No credit card required.
          </motion.p>
        </div>

        {/* Preview cards */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={5}
          className="relative mx-auto mt-12 max-w-md sm:mt-16"
        >
          <div className="rounded-2xl border border-border/60 bg-card/80 p-4 shadow-2xl shadow-violet-500/10 backdrop-blur-sm">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Upcoming Events
              </span>
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-900/50 dark:text-violet-300">
                This Week
              </span>
            </div>
            <div className="space-y-2.5">
              {[
                {
                  icon: "🎂",
                  title: "Mom's Birthday",
                  date: "Tomorrow",
                  relation: "Mother",
                  highlight: true,
                },
                {
                  icon: "💍",
                  title: "Wedding Anniversary",
                  date: "In 3 days",
                  relation: "Wife",
                  highlight: false,
                },
                {
                  icon: "🎂",
                  title: "Best Friend's Birthday",
                  date: "In 5 days",
                  relation: "Friend",
                  highlight: false,
                },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  variants={scaleIn}
                  initial="hidden"
                  animate="visible"
                  custom={6 + i}
                  className={`flex items-center gap-3 rounded-xl p-3 transition-colors ${
                    item.highlight
                      ? "bg-violet-50 dark:bg-violet-900/20"
                      : "bg-muted/50"
                  }`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-lg dark:bg-violet-900/40">
                    {item.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.relation}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xs font-medium ${
                        item.highlight
                          ? "text-violet-600 dark:text-violet-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      {item.date}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Event Types */}
      <section className="px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Track every kind of moment
            </h2>
            <p className="mt-2 text-muted-foreground">
              From birthdays to bills, we&apos;ve got you covered.
            </p>
          </motion.div>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {eventTypes.map((et, i) => (
              <motion.div
                key={et.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="group flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-card/80 p-4 text-center transition-all hover:shadow-lg hover:shadow-violet-500/5"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${et.color} text-2xl shadow-sm`}
                >
                  {et.icon}
                </div>
                <span className="text-sm font-medium">{et.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Everything you need to stay connected
            </h2>
            <p className="mt-2 text-muted-foreground">
              Powerful features designed to make remembering effortless.
            </p>
          </motion.div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="group rounded-xl border border-border/60 bg-card/80 p-5 transition-all hover:shadow-lg hover:shadow-violet-500/5"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose */}
      <section className="px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-blue-50 p-6 dark:border-violet-800/50 dark:from-violet-950/30 dark:to-blue-950/20 sm:p-10"
          >
            <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
              Why choose Life Moments?
            </h2>
            <p className="mt-2 text-center text-muted-foreground">
              Simple, thoughtful, and built for real life.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                "AI-powered wish generation",
                "Smart reminder scheduling",
                "Beautiful mobile-first design",
                "Email notifications",
                "Recurring yearly events",
                "Relationship tagging",
                "Dark & light mode",
                "Free forever — no catch",
              ].map((item, i) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className="flex items-center gap-2.5"
                >
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-600 dark:bg-violet-500">
                    <svg
                      className="h-3 w-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">{item}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-12 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-blue-500 shadow-lg shadow-violet-500/25">
            <Gift className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Ready to never forget again?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Join today and start keeping track of every moment that matters.
          </p>
          <div className="mt-6">
            {isLoggedIn ? (
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-violet-600 to-blue-500 text-white shadow-lg shadow-violet-500/25 hover:from-violet-700 hover:to-blue-600 dark:from-violet-500 dark:to-blue-400"
              >
                <Link href="/dashboard">
                  <Clock className="mr-2 h-4 w-4" />
                  Go to Dashboard
                </Link>
              </Button>
            ) : (
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-violet-600 to-blue-500 text-white shadow-lg shadow-violet-500/25 hover:from-violet-700 hover:to-blue-600 dark:from-violet-500 dark:to-blue-400"
              >
                <Link href="/login">
                  <Clock className="mr-2 h-4 w-4" />
                  Get Started Free
                </Link>
              </Button>
            )}
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 px-4 py-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="flex items-center gap-2">
            <Logo size={20} />
            <span className="text-sm font-medium text-muted-foreground">
              Life Moments
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Life Moments. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
