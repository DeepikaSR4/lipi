"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const handleSave = async () => {
    if (!auth.currentUser) return;
    setSaving(true);
    setSaveError("");
    try {
      await updateProfile(auth.currentUser, { displayName });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      setSaveError(e?.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <div className="p-8 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <h1 className="font-[family-name:var(--font-cormorant)] text-4xl font-bold mb-1">Settings</h1>
        <p className="font-[family-name:var(--font-space-grotesk)] text-sm text-lipi-muted">
          Manage your profile and preferences.
        </p>
      </motion.div>

      {/* Profile section */}
      <section className="border-2 border-lipi-border bg-white p-6 mb-6 rounded-[32px]" >
        <h2 className="font-[family-name:var(--font-space-grotesk)] font-bold text-sm mb-5 pb-3 border-b-2 border-lipi-border">
          Profile
        </h2>

        <div className="flex items-center gap-4 mb-6">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="Avatar" className="w-14 h-14 border-2 border-lipi-border rounded-[32px]" />
          ) : (
            <div className="w-14 h-14 border-2 border-lipi-border bg-lipi-lavender flex items-center justify-center font-[family-name:var(--font-cormorant)] text-2xl font-bold rounded-[32px]">
              {user?.displayName?.[0] ?? "U"}
            </div>
          )}
          <div>
            <div className="font-[family-name:var(--font-space-grotesk)] font-bold text-sm">{user?.displayName}</div>
            <div className="text-xs text-lipi-muted font-[family-name:var(--font-space-grotesk)]">{user?.email}</div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold font-[family-name:var(--font-space-grotesk)] mb-1">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="input-brutal max-w-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold font-[family-name:var(--font-space-grotesk)] mb-1">Email</label>
            <input
              type="email"
              value={user?.email ?? ""}
              disabled
              className="input-brutal max-w-xs bg-lipi-cream text-lipi-muted cursor-not-allowed"
            />
          </div>
          {saveError && (
            <div className="text-xs text-red-500 font-[family-name:var(--font-space-grotesk)]">{saveError}</div>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-lipi btn-primary text-sm px-5 py-2 w-fit"
          >
            {saving ? "Saving..." : saved ? "✓ Saved!" : "Save changes"}
          </button>
        </div>
      </section>

      {/* Plan section */}
      <section className="border-2 border-lipi-border bg-lipi-lavender p-6 mb-6 rounded-[32px]" >
        <h2 className="font-[family-name:var(--font-space-grotesk)] font-bold text-sm mb-3">Current Plan</h2>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-[family-name:var(--font-cormorant)] text-2xl font-bold">Free</div>
            <div className="text-xs text-lipi-text/60 font-[family-name:var(--font-space-grotesk)] mt-1">
              1 active font · Limited exports
            </div>
          </div>
          <button className="btn-lipi btn-dark text-sm">
            Upgrade →
          </button>
        </div>
      </section>

      {/* Danger zone */}
      <section className="border-2 border-red-300 bg-white p-6" >
        <h2 className="font-[family-name:var(--font-space-grotesk)] font-bold text-sm mb-3 text-red-600">
          Danger Zone
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-[family-name:var(--font-space-grotesk)] text-sm font-medium">Sign out</div>
            <div className="text-xs text-lipi-muted font-[family-name:var(--font-space-grotesk)]">
              You&apos;ll be redirected to the home page.
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="border-2 border-red-400 text-red-600 px-4 py-2 text-sm font-[family-name:var(--font-space-grotesk)] font-semibold hover:bg-red-50 transition-colors"
          >
            Sign out
          </button>
        </div>
      </section>
    </div>
  );
}
