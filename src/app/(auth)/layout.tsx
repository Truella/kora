import AppHeader from "../AppHeader";

// Brand bar, no sidebar — the auth and offline screens bring their own
// layout. The max-w-md reproduces the old root wrapper and is load-bearing:
// AuthShell's form column is `max-w-md` inside a flex-col, so without this
// centring constraint the login/verify/OTP forms go full-bleed on mobile.
// lg:max-w-5xl keeps the desktop split (form + story panel) as it was.
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppHeader />
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col lg:max-w-5xl">
        {children}
      </div>
    </>
  );
}
