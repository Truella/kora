import { Suspense } from "react";
import VerifyForm from "./VerifyForm";

export const metadata = { title: "Enter code" };

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  );
}
