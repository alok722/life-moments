export const dynamic = "force-dynamic";

import Link from "next/link";
import { MagicLinkForm } from "@/components/auth/magic-link-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  return (
    <Card className="border-border/60 shadow-lg shadow-violet-500/5">
      <CardHeader className="text-center">
        <div className="mx-auto mb-3">
          <svg width="48" height="48" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="login-g" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7c5cfc"/>
                <stop offset="100%" stopColor="#5b8def"/>
              </linearGradient>
            </defs>
            <rect width="32" height="32" rx="8" fill="url(#login-g)"/>
            <text x="16" y="22" textAnchor="middle" fontFamily="system-ui,-apple-system,sans-serif" fontWeight="700" fontSize="17" fill="white" letterSpacing="-0.5">LM</text>
            <circle cx="25" cy="8" r="2.5" fill="#34d399" opacity="0.9"/>
          </svg>
        </div>
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>
          Sign in with a magic link sent to your email
        </CardDescription>
      </CardHeader>
      <CardContent>
        <MagicLinkForm />
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-primary underline underline-offset-4 hover:text-primary/80">
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
