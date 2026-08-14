import type { Metadata, Viewport } from "next";
import { Inter, Anton, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import PageWrapper from "@/components/PageWrapper";
import { GamificationProvider } from "@/components/ui/providers/GamificationContext";
import ReadingProgressBar from "@/components/ReadingProgressBar";
import PageTransition from "@/components/PageTransition";
import PwaUpdateToast from "@/components/ui/primitives/PwaUpdateToast";
import { ThemeProvider } from "@/components/ui/providers/ThemeProvider";
import ThemedToaster from "@/components/ui/primitives/ThemedToaster";
import { AdminProvider } from "@/lib/auth-context";
import { UserAuthProvider } from "@/lib/user-auth-context";
import PreloaderGate from "@/components/ui/PreloaderGate";
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
  title: {
    default: "Brother's Fitness | Premium Gym in Lakhnadon",
    template: "%s | Brother's Fitness Lakhnadon"
  },
  description: "Pain is Temporary. Pride is Forever. Brother's Fitness offers professional strength training, HIIT, weight loss, and functional fitness with expert coaches Aman and Pradeep in Lakhnadon, Madhya Pradesh.",
  applicationName: "Brother's Fitness",
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  keywords: [
    "gym in lakhnadon", 
    "brothers fitness lakhnadon", 
    "brothers fitness", 
    "brothers fitness gym lakhnadon", 
    "fitness center lakhnadon", 
    "best gym near me",
    "strength training", 
    "personal trainer lakhnadon", 
    "weight loss lakhnadon",
    "workout",
    "bodybuilding lakhnadon"
  ],
  authors: [{ name: "Brother's Fitness", url: siteUrl }],
  creator: "Brother's Fitness",
  publisher: "Brother's Fitness",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
    languages: {
      'en-IN': '/en-IN',
    },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName: "Brother's Fitness Lakhnadon",
    title: "Brother's Fitness | Premium Gym in Lakhnadon",
    description: "Pain is Temporary. Pride is Forever. Professional strength training with expert coaches Aman and Pradeep.",
    images: [
      {
        url: "/assets/favicon.png",
        width: 512,
        height: 512,
        alt: "Brother's Fitness Logo",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@BrothersFitness",
    creator: "@BrothersFitness",
    title: "Brother's Fitness | Premium Gym in Lakhnadon",
    description: "Pain is Temporary. Pride is Forever. Join the best gym in Lakhnadon.",
    images: ["/assets/favicon.png"],
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: "/assets/favicon.png",
    shortcut: "/assets/favicon.png",
    apple: "/assets/favicon.png",
    other: {
      rel: 'apple-touch-icon-precomposed',
      url: '/assets/favicon.png',
    },
  },
  manifest: "/manifest.json",
  category: "Health & Fitness",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": ["HealthAndBeautyBusiness", "SportsActivityLocation", "LocalBusiness"],
              "name": "Brother's Fitness Gym Lakhnadon",
              "alternateName": "Brothers Fitness",
              "image": [
                "https://brothersfitness.in/assets/favicon.png"
              ],
              "logo": "https://brothersfitness.in/assets/favicon.png",
              "url": "https://brothersfitness.in",
              "telephone": "+910000000000",
              "email": "contact@brothersfitness.in",
              "description": "Premium gym and fitness center located in Lakhnadon, offering strength training, cardio, and personal coaching by Aman and Pradeep.",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "Lakhnadon City",
                "addressLocality": "Lakhnadon",
                "addressRegion": "Madhya Pradesh",
                "postalCode": "480886",
                "addressCountry": "IN"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": "22.6033",
                "longitude": "79.6015"
              },
              "openingHoursSpecification": [
                {
                  "@type": "OpeningHoursSpecification",
                  "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
                  "opens": "05:00",
                  "closes": "22:00"
                }
              ],
              "sameAs": [
                "https://www.instagram.com/brothersfitnesslakhnadon/",
                "https://www.facebook.com/brothersfitness"
              ],
              "priceRange": "₹₹"
            })
          }}
        />
      </head>
      <body className={`${inter.variable} ${anton.variable} ${jetBrainsMono.variable} font-sans surface-canvas text-hi antialiased`}>
        <ThemeProvider>
          <PreloaderGate />
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



