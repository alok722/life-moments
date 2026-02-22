export const dynamic = "force-dynamic";

import Link from "next/link";
import { MagicLinkForm } from "@/components/auth/magic-link-form";
import { Logo } from "@/components/ui/logo";
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
          <Logo size={48} />
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
