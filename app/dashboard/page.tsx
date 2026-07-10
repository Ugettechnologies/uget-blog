import { Suspense } from "react";
import DashboardPage from "@/components/DashboardPage";
import LoadingScreen from "@/components/LoadingScreen";

export default function Dashboard() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <DashboardPage />
    </Suspense>
  );
}
