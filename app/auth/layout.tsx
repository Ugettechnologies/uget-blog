import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | UGET Technology Academy",
  description: "Sign in to UGET Technology Academy",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
