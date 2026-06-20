import { Suspense } from "react";
import DashboardPage from "@/components/DashboardPage";

export default function Dashboard() {
  return (
    <Suspense fallback={<div style={{ height: "100vh", background: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading...</div>}>
      <DashboardPage />
    </Suspense>
  );
}
