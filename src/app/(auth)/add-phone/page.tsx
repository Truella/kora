import { Suspense } from "react";
import AddPhoneForm from "./AddPhoneForm";

export const metadata = { title: "Add your number" };

export default function AddPhonePage() {
  return (
    <Suspense>
      <AddPhoneForm />
    </Suspense>
  );
}
