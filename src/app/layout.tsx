import type { Metadata } from "next";
import { Space_Grotesk, Cormorant_Garamond, Caveat } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import { PostHogProvider } from "@/components/providers/PostHogProvider";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://lipi-rust.vercel.app"),
  title: {
    default: "Lipi — Turn your handwriting into identity",
    template: "%s | Lipi",
  },
  description:
    "Lipi is the aesthetic handwriting-to-font creation platform. Draw letters, upload handwriting, generate custom fonts, and export TTF/OTF files seamlessly.",
  keywords: [
    "handwriting font",
    "custom font creator",
    "font generator",
    "TTF OTF export",
    "handwriting to font",
    "free font maker",
  ],
  authors: [{ name: "Lipi Team" }],
  creator: "Lipi",
  publisher: "Lipi",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "Lipi — Turn your handwriting into identity",
    description:
      "Turn your handwriting into a fully usable font. Draw, upload, preview, and export instantly.",
    url: "https://lipi-rust.vercel.app",
    siteName: "Lipi",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lipi — Turn your handwriting into identity",
    description: "Turn your handwriting into a fully usable font. Draw, upload, preview, and export instantly.",
    creator: "@lipi_app",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${cormorant.variable} ${caveat.variable} antialiased`}
      >
        <PostHogProvider>
          <AuthProvider>{children}</AuthProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
