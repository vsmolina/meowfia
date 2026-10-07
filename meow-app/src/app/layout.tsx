import type { Metadata, Viewport } from "next";
import { Black_Ops_One, Barlow, IBM_Plex_Mono } from "next/font/google";
import { siteConfig } from "@/config/site";
import { siteUrl } from "@/lib/site-url";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { Analytics } from "@/components/layout/analytics";
import { MotionProvider } from "@/components/motion";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { JsonLd } from "@/components/seo/json-ld";
import "./globals.css";

const stencil = Black_Ops_One({ weight: "400", subsets: ["latin"], variable: "--font-stencil", display: "swap" });
const barlow = Barlow({ weight: ["400", "600", "700"], subsets: ["latin"], variable: "--font-barlow", display: "swap" });
// Mono is only used for small labels, so don't let it compete with the headline font for bandwidth
const plexMono = IBM_Plex_Mono({ weight: ["400"], subsets: ["latin"], variable: "--font-plex-mono", display: "swap", preload: false });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: `${siteConfig.name}: ${siteConfig.tagline}`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: siteConfig.colors.olive,
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${stencil.variable} ${barlow.variable} ${plexMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only z-50 rounded bg-ink px-4 py-2 text-paper focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        <MotionProvider>
          <TooltipProvider>
            <SiteHeader />
            <main id="main" className="flex-1">
              {children}
            </main>
            <SiteFooter />
            <BottomTabBar />
            <Toaster position="top-center" richColors />
          </TooltipProvider>
        </MotionProvider>
        <Analytics />
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Organization",
            name: siteConfig.name,
            url: siteUrl(),
            logo: siteUrl("/icon.svg"),
            description: siteConfig.description,
            founder: { "@type": "Person", name: siteConfig.creator.name },
            sameAs: [siteConfig.social.tiktok, siteConfig.social.instagram, siteConfig.social.youtube].filter(Boolean),
          }}
        />
      </body>
    </html>
  );
}
