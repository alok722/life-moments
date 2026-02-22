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

export default function SignupPage() {
  return (
    <Card className="border-border/60 shadow-lg shadow-violet-500/5">
      <CardHeader className="text-center">
        <div className="mx-auto mb-3">
          <Logo size={48} />
        </div>
        <CardTitle className="text-2xl">Create an account</CardTitle>
        <CardDescription>
          Enter your email to get started with Life Moments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <MagicLinkForm />
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary underline underline-offset-4 hover:text-primary/80">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
