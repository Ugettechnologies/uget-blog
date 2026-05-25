import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin | UGET Blog",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
