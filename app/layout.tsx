import type { Metadata, Viewport } from "next";
import { Inter, DotGothic16, Anton, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import PageWrapper from "@/components/PageWrapper";
import { GamificationProvider } from "@/components/GamificationContext";
import { TacticalSoundProvider } from "@/components/TacticalSoundContext";
import ReadingProgressBar from "@/components/ReadingProgressBar";
import PageTransition from "@/components/PageTransition";
import { AdminProvider } from "@/lib/auth-context";
import { UserAuthProvider } from "@/lib/user-auth-context";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter"
});

const dotGothic = DotGothic16({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dot"
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

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://brothersfitness.com'),
  title: "Brother's Fitness | Premium Gym in Your City",
  description: "Pain is Temporary. Pride is Forever. Brother's Fitness offers professional strength training, HIIT, and functional fitness with expert coaches Aman and Pradeep.",
  manifest: "/manifest.json",
  keywords: ["gym", "fitness", "strength training", "HIIT", "personal trainer", "workout", "Brother's Fitness"],
  authors: [{ name: "Brother's Fitness" }],
  creator: "Brother's Fitness",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://brothersfitness.com",
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
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${dotGothic.variable} ${anton.variable} ${jetBrainsMono.variable} font-sans bg-black text-white antialiased`}>
        <ReadingProgressBar />
        <Toaster
          theme="dark"
          position="top-center"
          richColors
          style={{ zIndex: 9999999 }}
          toastOptions={{
            style: {
              background: '#1a1a1a',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
            },
            duration: 5000
          }}
        />
        <AdminProvider>
          <UserAuthProvider>
            <GamificationProvider>
              <TacticalSoundProvider>
                <PageWrapper>
                  <PageTransition>
                    {children}
                  </PageTransition>
                </PageWrapper>
              </TacticalSoundProvider>
            </GamificationProvider>
          </UserAuthProvider>
        </AdminProvider>
      </body>
    </html>
  );
}