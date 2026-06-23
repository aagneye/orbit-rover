import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setSessionToken } from "@/lib/api";

function AuthCallbackInner() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const session = params.get("session");
    if (session) {
      setSessionToken(session);
    }
    router.replace("/");
  }, [params, router]);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-slate-400">Signing you in with GitLab…</p>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<main className="min-h-screen flex items-center justify-center text-slate-400">Loading…</main>}>
      <AuthCallbackInner />
    </Suspense>
  );
}
