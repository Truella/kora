import type { Metadata, Viewport } from "next";
import { Sora, Hind, Roboto_Mono } from "next/font/google";
import ServiceWorkerRegister from "./sw-register";
import AppHeader from "./AppHeader";
import AppNav from "./AppNav";
import "./globals.css";

const newsreader = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const plexSans = Hind({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const plexMono = Roboto_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
  display: "swap",
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
  themeColor: "#21164F",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${newsreader.variable} ${plexSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-dvh bg-paper font-sans text-indigo">
        <ServiceWorkerRegister />
        <AppHeader />
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col lg:max-w-5xl lg:flex-row lg:gap-8">
          <AppNav />
          <div className="order-1 flex min-w-0 flex-1 flex-col lg:order-2">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
