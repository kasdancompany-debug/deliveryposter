import { Suspense } from "react";
import { Loader2 } from "lucide-react";

function LoginLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
      <p className="text-sm text-muted-foreground">Loading sign in…</p>
    </div>
  );
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Suspense fallback={<LoginLoading />}>{children}</Suspense>;
}
