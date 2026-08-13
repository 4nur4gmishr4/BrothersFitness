import type { Metadata, Viewport } from "next";
import { Inter, Anton, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import PageWrapper from "@/components/PageWrapper";
import { GamificationProvider } from "@/components/GamificationContext";
import ReadingProgressBar from "@/components/ReadingProgressBar";
import PageTransition from "@/components/PageTransition";
import PwaUpdateToast from "@/components/PwaUpdateToast";
import { ThemeProvider } from "@/components/ThemeProvider";
import ThemedToaster from "@/components/ThemedToaster";
import { AdminProvider } from "@/lib/auth-context";
import { UserAuthProvider } from "@/lib/user-auth-context";
import SmartPreloaderWrapper from "@/components/ui/SmartPreloaderWrapper";
// Runs before first paint to apply the stored theme and prevent a
// flash of the wrong theme. Mirrors ThemeProvider's resolve logic.
const themeScript = `(function(){try{var s=localStorage.getItem("brofit_theme");var t=(s==="light"||s==="dark"||s==="system")?s:"system";var r=t==="light"?"light":t==="dark"?"dark":(window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark");var el=document.documentElement;if(t==="system"){el.removeAttribute("data-theme");}else{el.setAttribute("data-theme",t);}el.style.colorScheme=r;}catch(e){}})();`;

// Dev-only: next-pwa skips registration in development, but a service worker
// registered on localhost by an earlier `npm run start` survives and keeps
// intercepting requests — returning dev chunks as text/plain 404s. Unregister
// any stale worker so a prod/dev toggle never breaks the dev server.
const devSwCleanupScript = process.env.NODE_ENV === "development"
  ? `(function(){if("serviceWorker" in navigator){navigator.serviceWorker.getRegistrations().then(function(rs){rs.forEach(function(r){r.unregister();});});}})();`
  : "";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter"
});

// Heavy, ultra-condensed display face for hero + section headlines.
const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display"
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono"
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#D71921"
};

// Canonical site origin. Inlined at build time per deployment; the fallback is
// the real production domain (the old placeholder brothersfitness.com was not
// owned by the team and leaked wrong URLs into canonical/OG metadata).
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://brothersfitness.in';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Brother's Fitness | Premium Gym in Your City",
  description: "Pain is Temporary. Pride is Forever. Brother's Fitness offers professional strength training, HIIT, and functional fitness with expert coaches Aman and Pradeep.",
  manifest: "/manifest.json",
  keywords: ["gym", "fitness", "strength training", "HIIT", "personal trainer", "workout", "Brother's Fitness"],
  authors: [{ name: "Brother's Fitness" }],
  creator: "Brother's Fitness",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName: "Brother's Fitness",
    title: "Brother's Fitness | Premium Gym",
    description: "Pain is Temporary. Pride is Forever. Professional strength training with expert coaches.",
    images: [
      {
        url: "/assets/favicon.png",
        width: 512,
        height: 512,
        alt: "Brother's Fitness Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Brother's Fitness | Premium Gym",
    description: "Pain is Temporary. Pride is Forever.",
    images: ["/assets/favicon.png"],
  },
  icons: {
    icon: "/assets/favicon.png",
    shortcut: "/assets/favicon.png",
    apple: "/assets/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {process.env.NODE_ENV === "development" && (
          <script dangerouslySetInnerHTML={{ __html: devSwCleanupScript }} />
        )}
      </head>
      <body className={`${inter.variable} ${anton.variable} ${jetBrainsMono.variable} font-sans surface-canvas text-hi antialiased`}>
        <ThemeProvider>
          <SmartPreloaderWrapper />
          <ReadingProgressBar />
          <PwaUpdateToast />
          <ThemedToaster />
          <AdminProvider>
            <UserAuthProvider>
              <GamificationProvider>
                
                  <PageWrapper>
                    <PageTransition>
                      {children}
                    </PageTransition>
                  </PageWrapper>
                
              </GamificationProvider>
            </UserAuthProvider>
          </AdminProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}



