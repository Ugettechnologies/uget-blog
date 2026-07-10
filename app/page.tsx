import { Suspense } from "react";
import HomePage from "@/components/HomePage";
import LoadingScreen from "@/components/LoadingScreen";

export default function Page() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <HomePage />
    </Suspense>
  );
}
