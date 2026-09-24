import Image from "next/image";

// Slim brand bar for app + auth screens. Mounted by the (app) and (auth)
// route-group layouts, never by the root layout — so the landing page and
// the error pages get neither this bar nor the sidebar.
export default function AppHeader() {
  return (
    <header className="sticky top-0 z-10 bg-bg/95 pt-[env(safe-area-inset-top)] backdrop-blur md:h-[var(--app-header-h)]">
      <div className="mx-auto flex w-full max-w-md items-center px-4 py-3 md:h-full md:max-w-5xl md:py-0 md:pl-9">
        <Image
          src="/brand/kora-logo-primary-mono.svg"
          alt="Kora"
          width={105}
          height={60}
          className="h-11 w-auto"
          priority
        />
      </div>
    </header>
  );
}
