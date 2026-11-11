import type { Metadata } from "next";
import { Suspense } from "react";
import { Sora, Literata, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { AmbientField } from "@/components/theme/AmbientField";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { site } from "@/content/site";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const literata = Literata({
  variable: "--font-literata",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.domain),
  title: {
    default: `${site.name} — ${site.line}`,
    template: `%s · ${site.name}`,
  },
  description: site.heroSupport,

  verification: {
    google: "KK8Zf2ceQnbaf9yI_slnFNn-WLHnfqX2dpnMgFTzIe8",
  },

  openGraph: {
    title: `${site.name} — ${site.line}`,
    description: site.heroSupport,
    url: site.domain,
    siteName: site.name,
    locale: "en_IN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sora.variable} ${literata.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="relative flex min-h-full flex-col text-ink">
        <ThemeProvider>
          <AmbientField />
          <Suspense fallback={<div className="h-[var(--header-h)]" aria-hidden />}>
            <SiteHeader />
          </Suspense>
          <main className="relative z-0 flex-1">{children}</main>
          <SiteFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}
