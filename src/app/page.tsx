import { Navbar } from "@/components/layout/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { CompatibilityStrip } from "@/components/landing/CompatibilityStrip";
import { FeatureStrip } from "@/components/landing/FeatureStrip";
import { CreateFlowSection } from "@/components/landing/CreateFlowSection";
import { WorkspaceSection } from "@/components/landing/WorkspaceSection";
import { ExportSection } from "@/components/landing/ExportSection";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lipi — Turn your handwriting into identity",
  description:
    "The aesthetic handwriting-to-font creation platform. Draw letters, upload handwriting, generate custom fonts, and export TTF/OTF files.",
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-lipi-cream">
      <Navbar />
      <HeroSection />
      <CompatibilityStrip />
      <FeatureStrip />
      <CreateFlowSection />
      <WorkspaceSection />
      <ExportSection />

      {/* Footer */}
      <footer className="border-t-2 border-lipi-border bg-lipi-text text-lipi-cream px-6 py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-[family-name:var(--font-cormorant)] text-2xl font-bold">lipi</span>
          <p className="font-[family-name:var(--font-space-grotesk)] text-sm text-lipi-cream/50 text-center">
            Your handwriting, now a font. © 2025 Lipi
          </p>
          <div className="flex gap-4 text-sm text-lipi-cream/50 font-[family-name:var(--font-space-grotesk)]">
            <a href="/login" className="hover:text-lipi-cream transition-colors">Sign in</a>
            <a href="/signup" className="hover:text-lipi-cream transition-colors">Sign up</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
