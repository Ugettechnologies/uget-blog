import { Suspense } from "react";
import HomePage from "@/components/HomePage";

export default function Page() {
  return (
    <Suspense fallback={<div style={{ height: "100vh", background: "white" }} />}>
      <HomePage />
    </Suspense>
  );
}
