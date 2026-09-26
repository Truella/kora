import { Suspense } from "react";
import OnboardingForm from "./OnboardingForm";

export const metadata = { title: "Welcome" };

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingForm />
    </Suspense>
  );
}
