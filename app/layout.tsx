import type { Metadata, Viewport } from "next";
import { Inter, DotGothic16 } from "next/font/google";
import "./globals.css";
import PageWrapper from "@/components/PageWrapper";

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
  title: "Brother's Fitness",
  description: "Pain is Temporary. Pride is Forever.",
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
        <PageWrapper>
          {children}
        </PageWrapper>
      </body>
    </html>
  );
}