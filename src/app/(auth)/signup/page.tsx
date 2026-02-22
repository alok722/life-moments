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

export default function SignupPage() {
  return (
    <Card>
      <CardHeader className="text-center">
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
          <Link href="/login" className="font-medium text-primary underline">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
