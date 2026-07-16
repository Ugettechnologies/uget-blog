"use client";
import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * /auth is no longer a standalone page.
 * Any visit here is redirected to the home page with ?auth=signin
 * so the AuthModal overlay opens automatically.
 */
function AuthRedirectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("tab") === "signup" ? "signup" : "signin";

  useEffect(() => {
    router.replace(`/?auth=${mode}`);
  }, [router, mode]);

  return null;
}

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthRedirectInner />
    </Suspense>
  );
}
