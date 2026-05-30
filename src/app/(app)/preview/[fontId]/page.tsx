"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { getFontProject } from "@/lib/firestore";
import type { FontProject } from "@/types";
import { ExportCard } from "@/components/workspace/ExportCard";
import { useFontStore } from "@/store/fontStore";
import { PREVIEW_SAMPLES, type PreviewTab } from "@/types";
import { analytics } from "@/lib/analytics";
import { generateFont } from "@/lib/fontGenerator";

const TABS: { id: PreviewTab; label: string; size: string }[] = [
  { id: "heading", label: "Heading", size: "text-5xl" },
  { id: "paragraph", label: "Paragraph", size: "text-lg" },
  { id: "poster", label: "Poster", size: "text-7xl" },
  { id: "script", label: "Script", size: "text-2xl" },
];

export default function PreviewPage({
  params,
}: {
  params: Promise<{ fontId: string }>;
}) {
  const { fontId } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const { setFontId, setFontName, loadGlyphs } = useFontStore();

  const [project, setProject] = useState<FontProject | null>(null);
  const [activeTab, setActiveTab] = useState<PreviewTab>("heading");
  const [customText, setCustomText] = useState("");
  const [showExport, setShowExport] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fontUrl, setFontUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !fontId) return;
    getFontProject(fontId)
      .then((p) => {
        if (!p) { router.push("/dashboard"); return; }
        setProject(p);
        setFontId(fontId);
        setFontName(p.fontName);
        loadGlyphs(p.glyphs || {});
        analytics.trackPreviewOpened(fontId);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [fontId, user]);

  useEffect(() => {
    if (!project) return;
    let generatedUrl: string | null = null;

    const generatePreview = async () => {
      try {
        const buffer = await generateFont(project.glyphs, project.fontName, "ttf");
        const blob = new Blob([buffer], { type: "font/ttf" });
        generatedUrl = URL.createObjectURL(blob);
        setFontUrl(generatedUrl);
      } catch (e) {
        console.error("Failed to generate preview font:", e);
      }
    };
    generatePreview();

    return () => {
      // Revoke the locally-captured URL, not stale state
      if (generatedUrl) URL.revokeObjectURL(generatedUrl);
    };
  }, [project]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="border-2 border-lipi-border px-8 py-6 font-[family-name:var(--font-space-grotesk)] text-sm rounded-[32px]"
          
        >
          Loading preview...
        </div>
      </div>
    );
  }

  const displayText = customText || PREVIEW_SAMPLES[activeTab];
  const activeTabDef = TABS.find(t => t.id === activeTab)!;

  return (
    <div className="min-h-screen bg-lipi-cream p-8">
      {fontUrl && (
        <style dangerouslySetInnerHTML={{
          __html: `
            @font-face {
              font-family: 'PreviewCustomFont';
              src: url('${fontUrl}') format('truetype');
            }
          `
        }} />
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/dashboard" className="text-xs font-[family-name:var(--font-space-grotesk)] text-lipi-muted hover:text-lipi-text flex items-center gap-1 mb-2">
            ← Dashboard
          </Link>
          <h1 className="font-[family-name:var(--font-cormorant)] text-3xl font-bold">
            {project?.fontName}
          </h1>
          <div className="text-xs text-lipi-muted font-[family-name:var(--font-space-grotesk)] mt-1">
            {Object.keys(project?.glyphs || {}).length} glyphs · Font preview
          </div>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/workspace/${fontId}`}
            className="btn-lipi btn-secondary text-sm"
            
          >
            Edit →
          </Link>
          <button
            onClick={() => setShowExport(true)}
            className="btn-lipi btn-primary text-sm"
            
          >
            Export ↓
          </button>
        </div>
      </div>

      {/* Preview tabs */}
      <div className="flex gap-2 mb-6">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => {
              setActiveTab(id);
              analytics.trackPreviewTabChanged(id);
            }}
            className={`px-4 py-2 border-2 font-[family-name:var(--font-space-grotesk)] font-semibold text-sm transition-colors ${
              activeTab === id
                ? "border-lipi-border bg-lipi-text text-lipi-cream"
                : "border-lipi-border bg-lipi-cream text-lipi-text hover:bg-lipi-green/20"
            }`}
            style={activeTab === id ? { } : { }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Main preview */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="border-2 border-lipi-border bg-white p-12 mb-6 min-h-48 rounded-[32px] overflow-hidden"
      >
        <div 
          className={`${activeTabDef.size} text-lipi-text leading-tight whitespace-pre-wrap break-words`}
          style={{ fontFamily: fontUrl ? "'PreviewCustomFont', var(--font-caveat)" : "var(--font-caveat)" }}
        >
          {displayText}
        </div>
      </motion.div>

      {/* Custom text */}
      <div className="max-w-xl mb-8">
        <label className="block text-xs font-[family-name:var(--font-space-grotesk)] font-semibold mb-2">
          Type your own text
        </label>
        <textarea
          value={customText}
          onChange={e => setCustomText(e.target.value)}
          onBlur={() => {
            if (customText.trim()) analytics.trackPreviewTextEntered(customText.length);
          }}
          placeholder={PREVIEW_SAMPLES[activeTab]}
          rows={3}
          className="input-brutal resize-none"
        />
      </div>

      {/* Character showcase */}
      <div className="border-2 border-lipi-border p-6 bg-lipi-cream mb-8 rounded-[32px]">
        <div className="font-[family-name:var(--font-space-grotesk)] text-xs font-semibold mb-3 text-lipi-muted uppercase tracking-wide">
          Character Set
        </div>
        <div 
          className="text-2xl text-lipi-text leading-relaxed break-all"
          style={{ fontFamily: fontUrl ? "'PreviewCustomFont', var(--font-caveat)" : "var(--font-caveat)" }}
        >
          ABCDEFGHIJKLMNOPQRSTUVWXYZ
          <br />
          abcdefghijklmnopqrstuvwxyz
          <br />
          0123456789
        </div>
      </div>

      {/* Export modal */}
      {showExport && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setShowExport(false)}
        >
          <div className="w-full max-w-md">
            <ExportCard onClose={() => setShowExport(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
