import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import ServiceWorkerRegister from "./sw-register";
import BottomNav from "./nav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Kora — Digital Savings Circles",
    template: "%s | Kora",
  },
  description:
    "Invite-only digital ajo/chama savings circles. The organizer never holds the money.",
  applicationName: "Kora",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Kora",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/icons/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0B3D2E",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-dvh flex flex-col bg-zinc-50 dark:bg-black">
        <ServiceWorkerRegister />
        <header className="sticky top-0 z-10 border-b border-black/10 bg-[#0B3D2E] pt-[env(safe-area-inset-top)] text-white">
          <div className="mx-auto flex max-w-md items-center gap-2.5 px-4 py-3">
            <Image
              src="/icons/icon.svg"
              alt="Kora logo"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <div className="leading-tight">
              <p className="text-[17px] font-semibold tracking-tight">Kora</p>
              <p className="text-[11px] text-white/60">
                Savings circles, without the custody risk
              </p>
            </div>
          </div>
        </header>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
          {children}
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
