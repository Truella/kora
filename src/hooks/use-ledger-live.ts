"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// The postgres_changes subscription, lifted out of LedgerFeed so /home and
// /activity share one implementation rather than two that can drift.
//
// Scope is deliberately the same three money tables LedgerFeed has always
// watched — contributions, payouts and cycles. /home's attention queue also
// depends on join_requests and join_votes, and it is tempting to widen this,
// but the two-browser realtime rehearsal for the three-table set is still
// owed and this is the subscription that has to hold up on stage. Vote nudges
// refresh on navigation; widening the set is the upgrade once that is green.
//
// Reconnect after a drop refetches, so a silent gap can never leave the feed
// quietly missing events.
export function useLedgerLive(topic: string, onEvent: () => void) {
  const [live, setLive] = useState(false);
  const subscribedOnce = useRef(false);
  // Held in a ref so a caller passing a fresh closure every render does not
  // tear down and rebuild the channel on each one. Seeded with the first
  // value and then kept current in an effect — assigning during render is a
  // ref access the compiler rightly rejects.
  const handler = useRef(onEvent);
  useEffect(() => {
    handler.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    const notify = () => {
      if (!cancelled) handler.current();
    };

    const channel = supabase
      .channel(topic)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contributions" },
        notify,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "payouts" },
        notify,
      )
      .on(
        // Cycle rows carry the due dates the attention queue orders by —
        // without this a rescheduled cycle never refreshes home.
        "postgres_changes",
        { event: "*", schema: "public", table: "cycles" },
        notify,
      )
      .subscribe((status) => {
        if (cancelled) return;
        if (status === "SUBSCRIBED") {
          setLive(true);
          // First SUBSCRIBED has fresh server data; anything later is a
          // reconnect after a drop, so resync to cover missed events.
          if (subscribedOnce.current) notify();
          else subscribedOnce.current = true;
        } else if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT" ||
          status === "CLOSED"
        ) {
          setLive(false);
        }
      });

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [topic]);

  return live;
}
