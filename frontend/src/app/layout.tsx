import type { Metadata } from "next";
import { Inter, Orbitron, Space_Mono, Press_Start_2P } from "next/font/google";
import "./globals.css";
import { NotificationProvider } from "@/components/ui/notification";
import { KaijuProvider } from "@/ui/providers/KaijuProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { Web3Provider } from "@/lib/web3/provider";
import { CommandPalette, PWAInstallBanner, PWAUpdateBanner, OfflineIndicator } from "@/components/ui";
import { ResponsiveLayout } from "@/components/layouts";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const pixelFont = Press_Start_2P({
  variable: "--font-pixel",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Kaiju No. 69 - The Ultimate Battle Arena",
  description: "Enter the world of epic Kaiju battles across elemental territories",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Kaiju 69",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${orbitron.variable} ${spaceMono.variable} ${pixelFont.variable} antialiased`}
      >
        <QueryProvider>
          <Web3Provider>
            <NotificationProvider>
              <KaijuProvider>
                <ResponsiveLayout>
                  <OfflineIndicator />
                  <PWAUpdateBanner />
                  {children}
                  <PWAInstallBanner />
                  <CommandPalette />
                </ResponsiveLayout>
              </KaijuProvider>
            </NotificationProvider>
          </Web3Provider>
        </QueryProvider>
      </body>
    </html>
  );
}
