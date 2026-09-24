import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Landing from "./Landing";

export const metadata = {
  title: "Kora — Save together. Keep everyone in the loop.",
};

export default async function RootPage() {
  // / is the public landing page only. Signed-in members live on /home
  // (the proxy sends logged-in /login visitors there, and logged-in /
  // visitors get redirected below).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/home");
  return <Landing />;
}
