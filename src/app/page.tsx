import { createClient } from "@/lib/supabase/server";
import DashboardHome from "./DashboardHome";
import Landing from "./Landing";

export const metadata = {
  title: "Kora — Save together. Keep everyone in the loop.",
};

export default async function RootPage() {
  // One route, two audiences: guests get the public landing page,
  // signed-in members get their dashboard. (The proxy leaves "/" public
  // exactly so guests can meet the product before signing in.)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) return <DashboardHome />;
  return <Landing />;
}
