export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-violet-50 via-background to-blue-50 px-4 dark:from-violet-950/30 dark:via-background dark:to-blue-950/30">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
