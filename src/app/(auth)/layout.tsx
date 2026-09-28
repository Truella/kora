import AppHeader from "../AppHeader";

// Brand bar, no sidebar — the auth screens bring their own layout. The
// max-w-md is load-bearing on mobile: AuthShell's form column is `max-w-md`
// inside a flex-col, so without this the forms go full-bleed. lg:max-w-6xl
// caps the desktop split (mock image + form) in a centred full-width
// container.
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppHeader />
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col lg:max-w-6xl">
        {children}
      </div>
    </>
  );
}
