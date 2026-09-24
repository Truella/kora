import type { Metadata, Viewport } from "next";
import { Sora, Hind, Roboto_Mono } from "next/font/google";
import ServiceWorkerRegister from "./sw-register";
import AppHeader from "./AppHeader";
import AppNav from "./AppNav";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const hind = Hind({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const robotoMono = Roboto_Mono({
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
    // Adaptive SVG only. Raster/ICO fallbacks are deliberately NOT linked:
    // when both are declared Chrome may silently pick a raster (favicon-16/32
    // are fixed light-mode art), which defeats the light/dark switch.
    // /favicon.ico still exists at the site root for the HTML-spec root
    // fallback (Safari/legacy) and crawler/SERP use — it carries the
    // keyline mark, which reads on both light and dark.
    icon: [{ url: "/icons/favicon.svg?v=3", type: "image/svg+xml" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#14524F",
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
      className={`${sora.variable} ${hind.variable} ${robotoMono.variable} h-full antialiased`}
    >
      <body className="min-h-dvh bg-bg font-sans text-text-primary">
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
