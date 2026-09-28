// Brand bar, no sidebar — the auth screens bring their own layout.
// Full-bleed: the split columns span the viewport width; each column
// constrains its own inner content (see AuthShell).
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh w-full flex-1 flex-col">{children}</div>
  );
}
