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
    <Card>
      <CardHeader className="text-center">
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
          <Link href="/signup" className="font-medium text-primary underline">
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
