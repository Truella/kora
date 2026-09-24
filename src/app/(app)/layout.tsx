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
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col lg:max-w-5xl lg:flex-row lg:gap-8">
        <AppNav />
        <div className="order-1 flex min-w-0 flex-1 flex-col lg:order-2">
          {children}
        </div>
      </div>
    </>
  );
}
