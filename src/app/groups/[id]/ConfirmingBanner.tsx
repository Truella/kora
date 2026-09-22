"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Banner + poll-confirm after Flutterwave redirects back with ?paid=1.
// The ?paid=1 param is NEVER trusted as proof — it only triggers
// server refetches until the webhook flips contributions.status.
// If the window expires with no flip (cancelled/abandoned checkout),
// it settles on a terminal "not confirmed" state instead of spinning.
export default function ConfirmingBanner() {
  const router = useRouter();
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      router.refresh();
      if (attempts >= 6) {
        clearInterval(timer);
        setExpired(true);
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="rounded-2xl bg-gold/15 px-4 py-3 text-sm text-ink dark:text-white">
      {expired ? (
        <>
          No payment confirmed yet — if you completed the checkout, wait a
          moment and reload; otherwise try paying again below.
        </>
      ) : (
        <>
          Back from Flutterwave — confirming payment. Status flips to paid
          once the webhook verifies the charge.
        </>
      )}
    </div>
  );
}
