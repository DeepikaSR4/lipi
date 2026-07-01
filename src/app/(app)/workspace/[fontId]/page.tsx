"use client";

import { useEffect, useRef, useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { getFontProject, saveFontProject } from "@/lib/firestore";
import { useFontStore } from "@/store/fontStore";
import { Toolbar } from "@/components/workspace/Toolbar";
import { DrawingCanvas } from "@/components/workspace/DrawingCanvas";
import { CharacterGrid } from "@/components/workspace/CharacterGrid";
import { ExportCard } from "@/components/workspace/ExportCard";

export default function WorkspacePage({
  params,
}: {
  params: Promise<{ fontId: string }>;
}) {
  const { fontId } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const { setFontId, setFontName, loadGlyphs, glyphs, fontName } = useFontStore();
  const [loading, setLoading] = useState(true);
  const [showExport, setShowExport] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "error">("synced");
  const latestGlyphs = useRef(glyphs);

  // Load project
  useEffect(() => {
    if (!user || !fontId) return;

    // If we navigated here from the upload page, the store is already populated
    // (upload page calls setFontId + setFontName + loadGlyphs before pushing).
    // Skip the Firestore fetch to avoid a race where the write hasn't propagated yet.
    const storeState = useFontStore.getState();
    if (storeState.fontId === fontId && storeState.fontName) {
      setLoading(false);
      return;
    }

    const fetchProject = async (retries = 1) => {
      const project = await getFontProject(fontId);
      if (!project) {
        if (retries > 0) {
          // Brief delay then retry — handles Firestore write propagation lag
          await new Promise(r => setTimeout(r, 600));
          return fetchProject(retries - 1);
        }
        router.push("/dashboard");
        return;
      }
      setFontId(fontId);
      setFontName(project.fontName);
      loadGlyphs(project.glyphs || {});
    };

    fetchProject()
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [fontId, user]);


  // Keep ref up to date
  useEffect(() => {
    latestGlyphs.current = glyphs;
  }, [glyphs]);

  // Debounced Auto-save when glyphs change
  useEffect(() => {
    if (!user || !fontId || loading) return;
    
    Promise.resolve().then(() => {
      setSyncStatus("syncing");
    });
    const timeout = setTimeout(async () => {
      try {
        await saveFontProject(user.uid, fontId, { glyphs: latestGlyphs.current });
        setSyncStatus("synced");
      } catch (err) {
        console.error("Auto-save failed:", err);
        setSyncStatus("error");
      }
    }, 2000); // 2 second debounce

    return () => clearTimeout(timeout);
  }, [glyphs, user, fontId, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-lipi-cream">
        <div className="border-2 border-lipi-border px-8 py-6 font-[family-name:var(--font-space-grotesk)] text-sm rounded-[32px]"
          
        >
          Loading workspace...
        </div>
      </div>
    );
  }

  return (
    <div className="h-dvh flex flex-col bg-lipi-cream overflow-hidden">
      {/* Top navigation bar */}
      <div className="border-b-2 border-lipi-border px-4 py-2 flex items-center gap-1.5 sm:gap-4 bg-lipi-cream z-30 w-full max-w-full">
        <Link
          href="/dashboard"
          className="text-xs font-[family-name:var(--font-space-grotesk)] text-lipi-muted hover:text-lipi-text flex items-center gap-1 shrink-0"
        >
          <span className="hidden sm:inline">← Dashboard</span>
          <span className="sm:hidden">←</span>
        </Link>
        <span className="text-lipi-border/30">|</span>
        <span className="font-[family-name:var(--font-space-grotesk)] font-bold text-sm flex items-center gap-1.5 shrink-0">
          {fontName}
          {/* Mobile sync status dot */}
          <span className="sm:hidden flex items-center">
            <span className={`w-2 h-2 rounded-full ${syncStatus === "syncing" ? "bg-blue-500 animate-pulse" : syncStatus === "error" ? "bg-red-500" : "bg-lipi-green"}`} />
          </span>
        </span>
        <div className="hidden sm:flex items-center gap-4 text-xs font-[family-name:var(--font-space-grotesk)] mt-1">
          <span className="text-lipi-muted">{Object.keys(glyphs).length} glyphs</span>
          <span className="text-lipi-border/30">·</span>
          <span className={`flex items-center gap-1 ${syncStatus === "syncing" ? "text-blue-500" : syncStatus === "error" ? "text-red-500" : "text-lipi-green"}`}>
            {syncStatus === "syncing" && (
              <><span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> Saving...</>
            )}
            {syncStatus === "synced" && (
              <><span className="w-2 h-2 rounded-full bg-lipi-green" /> Saved to cloud</>
            )}
            {syncStatus === "error" && (
              <><span className="w-2 h-2 rounded-full bg-red-500" /> Save failed</>
            )}
          </span>
        </div>
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <Link
            href={`/preview/${fontId}`}
            className="btn-lipi btn-secondary text-xs py-1 px-2 sm:py-1.5 sm:px-3 shrink-0"
          >
            Preview ↗
          </Link>
          <motion.button
            onClick={() => setShowExport(true)}
            whileHover={{ x: -1, y: -1, }}
            whileTap={{ x: 1, y: 1, }}
            className="btn-lipi btn-primary text-xs py-1 px-2 sm:py-1.5 sm:px-3 shrink-0"
          >
            <span className="hidden sm:inline">Export font ↓</span>
            <span className="sm:hidden">Export ↓</span>
          </motion.button>
        </div>
      </div>

      {/* Toolbar */}
      <Toolbar />

      {/* Main workspace: Canvas | Grid */}
      <div className="flex flex-1 overflow-y-auto md:overflow-hidden flex-col md:flex-row relative w-full max-w-full min-w-0">
        <div className="w-full max-w-full flex-shrink-0 md:flex-1 flex flex-col min-w-0">
          <DrawingCanvas />
        </div>
        <div className="w-full md:w-80 flex-shrink-0 border-t-2 md:border-t-0 md:border-l-2 border-lipi-border flex flex-col bg-lipi-cream min-w-0">
          <CharacterGrid />
        </div>
        {/* Mobile scroll indicator gradient */}
        <div className="md:hidden pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-lipi-cream/90 to-transparent z-10" />
      </div>

      {/* Export overlay */}
      <AnimatePresence>
        {showExport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowExport(false)}
          >
            <div className="w-full max-w-md">
              <ExportCard onClose={() => setShowExport(false)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
