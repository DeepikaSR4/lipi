"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/layout/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-lipi-cream flex items-center justify-center">
        <div className="border-2 border-lipi-border px-8 py-6 font-[family-name:var(--font-space-grotesk)] text-sm rounded-[32px]"
          
        >
          Loading...
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-lipi-cream flex">
      <Sidebar />
      <main className="flex-1 ml-14 min-h-screen">
        {children}
      </main>
    </div>
  );
}
