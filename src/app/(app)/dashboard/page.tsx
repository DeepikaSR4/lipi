"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, type Variants } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { getFontProjects, deleteFontProject } from "@/lib/firestore";
import { analytics } from "@/lib/analytics";
import type { FontProject } from "@/types";

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <div className="font-[family-name:var(--font-caveat)] text-8xl text-lipi-border/20 mb-6">Aa</div>
      <h3 className="font-[family-name:var(--font-cormorant)] text-3xl font-semibold mb-3">
        No fonts yet.
      </h3>
      <p className="font-[family-name:var(--font-space-grotesk)] text-sm text-lipi-muted mb-8 max-w-xs">
        Create your first handwriting font — draw it or upload your handwriting.
      </p>
      <Link
        href="/create"
        onClick={() => analytics.trackCreateFontClicked("empty_state")}
        className="btn-lipi btn-primary"
      >
        Create your first font →
      </Link>
    </motion.div>
  );
}

function FontCard({ project, index, onDelete }: { project: FontProject; index: number; onDelete: () => void }) {
  const colors = ["#C7F04F", "#F5F2EA", "#123524", "#C9B6F5"];
  const color = colors[index % colors.length];
  const glyphCount = Object.keys(project.glyphs).length;

  const formatDate = (date: any) => {
    if (!date) return "";
    const d = new Date(date?.seconds ? date.seconds * 1000 : date);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ x: -3, y: -3 }}
      className="border-2 border-lipi-border bg-white group cursor-pointer rounded-xl sm:rounded-[32px] overflow-hidden"
    >
      {/* Mobile View: Compact List Item */}
      <div className="flex sm:hidden p-4 items-center gap-4">
        <Link href={`/workspace/${project.id}`} className="flex-1 flex items-center gap-4 min-w-0">
          <div
            className="w-12 h-12 flex items-center justify-center border-2 border-lipi-border flex-shrink-0"
            style={{ backgroundColor: color }}
          >
            <span className="font-[family-name:var(--font-caveat)] text-xl text-lipi-text font-bold">
              {project.fontName.slice(0, 2) || "Aa"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-[family-name:var(--font-space-grotesk)] font-bold text-sm truncate text-lipi-text">
              {project.fontName}
            </div>
            <div className="text-[10px] text-lipi-muted font-[family-name:var(--font-space-grotesk)] mt-0.5">
              {glyphCount} / 62 glyphs
            </div>
            <div className="text-[9px] text-lipi-muted font-[family-name:var(--font-space-grotesk)] mt-0.5">
              Created {formatDate(project.createdAt)} · Edited {formatDate(project.updatedAt)}
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-2 text-[11px] font-[family-name:var(--font-space-grotesk)] font-bold shrink-0">
          <Link href={`/workspace/${project.id}`} className="text-lipi-text underline">
            Edit
          </Link>
          <span className="text-lipi-border/30">·</span>
          <Link href={`/preview/${project.id}`} className="text-lipi-text underline">
            Preview
          </Link>
          <span className="text-lipi-border/30">·</span>
          <button onClick={onDelete} className="text-red-500 underline cursor-pointer">
            Delete
          </button>
        </div>
      </div>

      {/* Desktop View: Full Card */}
      <div className="hidden sm:block h-full">
        <Link href={`/workspace/${project.id}`}>
          {/* Preview area */}
          <div
            className="border-b-2 border-lipi-border p-6 flex items-center justify-center h-32"
            style={{ backgroundColor: color }}
          >
            <span
              className="font-[family-name:var(--font-caveat)] text-4xl text-lipi-text leading-none"
            >
              {project.fontName.slice(0, 2) || "Aa"}
            </span>
          </div>

          {/* Meta */}
          <div className="p-4">
            <div className="font-[family-name:var(--font-space-grotesk)] font-bold text-sm mb-1">
              {project.fontName}
            </div>
            <div className="text-xs text-lipi-muted font-[family-name:var(--font-space-grotesk)]">
              {glyphCount} / 62 glyphs
            </div>
            <div className="text-[10px] text-lipi-muted/60 font-[family-name:var(--font-space-grotesk)] mt-1">
              Created: {formatDate(project.createdAt)} <br/>
              Last edited: {formatDate(project.updatedAt)}
            </div>

            {/* Progress bar */}
            <div className="mt-2 h-1 bg-lipi-border/20 border border-lipi-border/20">
              <div
                className="h-full bg-lipi-green"
                style={{ width: `${(glyphCount / 62) * 100}%` }}
              />
            </div>
          </div>
        </Link>

        {/* Actions */}
        <div className="px-4 pb-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link
            href={`/preview/${project.id}`}
            className="text-xs font-[family-name:var(--font-space-grotesk)] underline underline-offset-2"
          >
            Preview
          </Link>
          <span className="text-lipi-muted">·</span>
          <button
            onClick={onDelete}
            className="text-xs font-[family-name:var(--font-space-grotesk)] text-red-500 underline underline-offset-2 cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<FontProject[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProjects = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getFontProjects(user.uid);
      setProjects(data);
    } catch {
      // Graceful degradation if Firestore not configured
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    loadProjects(); 
    if (user) analytics.trackDashboardViewed(projects.length);
  }, [user]); // We intentionally track this roughly per mount

  const handleDelete = async (fontId: string) => {
    if (!confirm("Delete this font project?")) return;
    await deleteFontProject(fontId);
    analytics.trackFontDeleted(fontId);
    loadProjects();
  };

  const containerVariants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } },
  };

  const getMillis = (val: any) => {
    if (!val) return 0;
    if (val.seconds) return val.seconds * 1000;
    return new Date(val).getTime() || 0;
  };
  const chronologicalIds = [...projects]
    .sort((a, b) => getMillis(a.createdAt) - getMillis(b.createdAt))
    .map(p => p.id);

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4"
      >
        <div>
          <div className="font-[family-name:var(--font-caveat)] text-lipi-muted text-sm mb-1">
            good day,
          </div>
          <h1 className="font-[family-name:var(--font-cormorant)] text-4xl font-bold">
            {user?.displayName?.split(" ")[0] ?? "Creator"}
          </h1>
        </div>
        <Link 
          href="/create" 
          className="btn-lipi btn-primary"
          onClick={() => analytics.trackCreateFontClicked("header")}
        >
          + New Font
        </Link>
      </motion.div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="border-2 border-lipi-border/10 bg-lipi-border/5 rounded-[32px] h-[216px] animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState />
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-8"
        >
          {projects.map(project => (
            <FontCard
              key={project.id}
              project={project}
              index={chronologicalIds.indexOf(project.id)}
              onDelete={() => handleDelete(project.id)}
            />
          ))}

          {/* New font card */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => {
              analytics.trackCreateFontClicked("grid_card");
              router.push("/create");
            }}
            className="border-2 border-dashed border-lipi-border cursor-pointer hover:bg-lipi-green/10 transition-colors group rounded-xl sm:rounded-[32px]"
          >
            {/* Mobile list view */}
            <div className="flex sm:hidden p-4 items-center gap-4 justify-center">
              <span className="text-2xl text-lipi-border/30 group-hover:text-lipi-text transition-colors">+</span>
              <span className="text-xs font-[family-name:var(--font-space-grotesk)] font-bold text-lipi-muted group-hover:text-lipi-text transition-colors">
                Create new font project
              </span>
            </div>
            {/* Desktop grid view */}
            <div className="hidden sm:flex flex-col items-center justify-center min-h-[200px]">
              <span className="text-4xl text-lipi-border/30 group-hover:text-lipi-text transition-colors mb-2">+</span>
              <span className="text-xs font-[family-name:var(--font-space-grotesk)] text-lipi-muted group-hover:text-lipi-text transition-colors">
                New font
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
