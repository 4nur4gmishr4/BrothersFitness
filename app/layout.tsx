import type { Metadata, Viewport } from "next";
import { Inter, DotGothic16 } from "next/font/google";
import "./globals.css";
import PageWrapper from "@/components/PageWrapper";
import { GamificationProvider } from "@/components/GamificationContext";
import ReadingProgressBar from "@/components/ReadingProgressBar";
import PageTransition from "@/components/PageTransition";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter"
});

const dotGothic = DotGothic16({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dot"
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
      <body className={`${inter.variable} ${dotGothic.variable} font-sans bg-black text-white antialiased`}>
        <ReadingProgressBar />
        <GamificationProvider>
          <PageWrapper>
            <PageTransition>
              {children}
            </PageTransition>
          </PageWrapper>
        </GamificationProvider>
      </body>
    </html>
  );
}