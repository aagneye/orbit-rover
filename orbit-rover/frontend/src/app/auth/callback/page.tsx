"use client";

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
    router.replace("/dashboard");
  }, [params, router]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-surface px-4">
      <div className="card-surface p-10 text-center max-w-sm w-full">
        <div className="w-12 h-12 rounded-full bg-orbit-50 text-orbit-600 flex items-center justify-center mx-auto mb-4 text-xl">
          ✓
        </div>
        <p className="font-medium text-stone-900">Signing you in with GitLab…</p>
        <p className="text-sm text-stone-500 mt-2">Redirecting to dashboard</p>
      </div>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center text-stone-400 bg-surface">
          Loading…
        </main>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  );
}
