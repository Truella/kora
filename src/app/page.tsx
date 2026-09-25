import Landing from "./Landing";

export const metadata = {
  title: "Kora · Save together. Keep everyone in the loop.",
};

// / is the public landing page for everyone — guests and signed-in members
// alike. The member dashboard lives at /home (AppNav's Home tab links there),
// so a logged-in visitor can still read what Kora is before jumping into the
// app. Landing is chrome-free for every session state and does its own
// session-aware nav, so no server auth lookup is needed here.
export default function RootPage() {
  return <Landing />;
}
