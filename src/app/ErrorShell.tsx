import Image from "next/image";

// Shared chrome-free shell for the 404, route errors and global errors.
// Deliberately lives at the app root, outside the (app) and (auth) route
// groups, so AppNav and AppHeader are structurally absent from all three —
// the isolation is a property of the layout tree, not a runtime guard.
export default function ErrorShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-bg px-6 py-16 text-center">
      <Image
        src="/brand/kora-logo-primary-mono.svg"
        alt="Kora"
        width={105}
        height={60}
        className="h-10 w-auto"
        priority
      />
      {children}
    </main>
  );
}
