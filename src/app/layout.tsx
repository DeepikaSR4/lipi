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
  title: "Lipi — Turn your handwriting into identity",
  description:
    "Lipi is the aesthetic handwriting-to-font creation platform. Draw letters, upload handwriting, generate custom fonts, and export TTF/OTF files.",
  keywords: [
    "handwriting font",
    "custom font creator",
    "font generator",
    "TTF OTF export",
    "handwriting to font",
  ],
  openGraph: {
    title: "Lipi — Your handwriting, now a font.",
    description:
      "Turn your handwriting into a fully usable font. Draw, upload, preview, and export.",
    type: "website",
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
