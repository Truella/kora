import AppHeader from "../AppHeader";
import AppNav from "../AppNav";

// Chrome for the signed-in app only. The landing page, the auth/offline
// screens and the error pages all live outside this group, so the sidebar
// structurally cannot render on them — the root-level not-found.tsx /
// error.tsx / global-error.tsx are not descendants of this layout.
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppHeader />
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col md:max-w-5xl md:flex-row md:gap-8">
        <AppNav />
        {/* Bottom clearance for the fixed mobile tab bar (bar height +
            safe-area); none from tablet up where the sidebar rail is shown. */}
        <div className="order-1 flex min-w-0 flex-1 flex-col pb-[calc(76px+env(safe-area-inset-bottom))] md:order-2 md:pb-0">
          {children}
        </div>
      </div>
    </>
  );
}
