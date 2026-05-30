"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { PillButton } from "@/components/ui/PillButton";
import { usePathname } from "next/navigation";

export function Navbar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const isMarketing = pathname === "/";

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" as const }}
      className="sticky top-0 z-50 bg-lipi-cream border-b-2 border-lipi-border flex items-center justify-between px-6 h-14"
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 group">
        <span
          className="font-[family-name:var(--font-cormorant)] text-2xl font-bold tracking-tight text-lipi-text group-hover:text-lipi-dark transition-colors"
          style={{ letterSpacing: "-0.03em" }}
        >
          lipi
        </span>
        <span className="text-annotation text-xs rotate-12 text-lipi-muted hidden sm:block">
          ✦
        </span>
      </Link>

      {/* Nav links (marketing only) */}
      {isMarketing && (
        <div className="hidden md:flex items-center gap-6 font-[family-name:var(--font-space-grotesk)] text-sm font-medium text-lipi-text">
          <Link
            href="#features"
            className="hover:text-lipi-dark border-b-2 border-transparent hover:border-lipi-text transition-all pb-0.5"
          >
            Features
          </Link>
          <Link
            href="#create"
            className="hover:text-lipi-dark border-b-2 border-transparent hover:border-lipi-text transition-all pb-0.5"
          >
            How it works
          </Link>
          <Link
            href="#export"
            className="hover:text-lipi-dark border-b-2 border-transparent hover:border-lipi-text transition-all pb-0.5"
          >
            Export
          </Link>
        </div>
      )}

      {/* CTA */}
      <div className="flex items-center gap-3">
        {user ? (
          <PillButton href="/dashboard" variant="primary" size="sm">
            Dashboard
          </PillButton>
        ) : (
          <>
            <PillButton href="/login" variant="secondary" size="sm" className="hidden sm:inline-flex">
              Sign in
            </PillButton>
            <PillButton href="/signup" variant="primary" size="sm">
              Start free
            </PillButton>
          </>
        )}
      </div>
    </motion.nav>
  );
}
