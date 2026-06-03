"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar, HomeIcon, PlusIcon, SettingsIcon } from "@/components/layout/Sidebar";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-lipi-cream flex items-center justify-center">
        <div className="border-2 border-lipi-border px-8 py-6 font-[family-name:var(--font-space-grotesk)] text-sm rounded-[32px]">
          Loading...
        </div>
      </div>
    );
  }

  if (!user) return null;

  const isWorkspace = pathname?.startsWith("/workspace/");

  const navItems = [
    { href: "/dashboard", label: "Home", icon: <HomeIcon /> },
    { href: "/create", label: "New Font", icon: <PlusIcon /> },
    { href: "/settings", label: "Settings", icon: <SettingsIcon /> },
  ];

  return (
    <div className="min-h-screen bg-lipi-cream flex flex-col md:flex-row relative">
      <Sidebar />
      <main className={cn(
        "flex-1 ml-0 md:ml-14 min-h-screen min-w-0 overflow-x-hidden",
        isWorkspace ? "pb-0" : "pb-16 md:pb-0"
      )}>
        {children}
      </main>

      {/* Mobile Bottom Navigation (hidden in workspace view) */}
      {!isWorkspace && (
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-lipi-cream border-t-2 border-lipi-border z-40 md:hidden flex items-center justify-around px-4">
          {navItems.map(({ href, label, icon }) => {
            const isActive = pathname?.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center w-12 h-12 border-2 border-transparent transition-all",
                  isActive && "bg-lipi-green border-lipi-border shadow-[2px_2px_0px_#111]"
                )}
              >
                <span className={cn(isActive ? "text-lipi-text" : "text-lipi-muted")}>
                  {icon}
                </span>
                <span className="text-[9px] font-[family-name:var(--font-space-grotesk)] font-bold mt-0.5 uppercase tracking-wide">
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
