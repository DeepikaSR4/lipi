"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { analytics } from "@/lib/analytics";
import { PillButton } from "@/components/ui/PillButton";

export default function SignupPage() {
  const { signUpWithEmail, signInWithGoogle, error, loading, user } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    analytics.trackSignupStarted("email"); // default intent
  }, []);

  useEffect(() => {
    if (user && !loading) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!name || !email || !password) { setFormError("Please fill all fields."); return; }
    if (password.length < 6) { setFormError("Password must be at least 6 characters."); return; }
    await signUpWithEmail(name, email, password);
    if (!error) {
      analytics.trackSignupCompleted("email");
      router.push("/dashboard");
    }
  };

  const handleGoogle = async () => {
    await signInWithGoogle();
    analytics.trackSignupCompleted("google");
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-lipi-cream flex">
      {/* LEFT — Branding */}
      <motion.div
        initial={{ x: -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="hidden md:flex flex-col justify-between bg-lipi-dark border-r-2 border-lipi-border w-[42%] p-12"
      >
        <Link href="/" className="font-[family-name:var(--font-cormorant)] text-3xl font-bold text-lipi-cream">
          lipi
        </Link>
        <div>
          <h1 className="font-[family-name:var(--font-cormorant)] text-5xl font-semibold leading-tight mb-4 text-lipi-cream">
            Start your
            <br />
            <em className="text-lipi-green">font journey.</em>
          </h1>
          <p className="font-[family-name:var(--font-space-grotesk)] text-lipi-cream/50 text-sm">
            Free to start. No design experience needed.
          </p>
        </div>
        <div className="flex gap-4">
          {["A","b","C","d"].map(c => (
            <div key={c} className="w-12 h-12 border-2 border-lipi-green/30 flex items-center justify-center font-[family-name:var(--font-caveat)] text-2xl text-lipi-cream/40">
              {c}
            </div>
          ))}
        </div>
      </motion.div>

      {/* RIGHT — Form */}
      <motion.div
        initial={{ x: 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex-1 flex items-center justify-center p-8"
      >
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold mb-1">Create account</h2>
            <p className="text-sm text-lipi-muted font-[family-name:var(--font-space-grotesk)]">
              Already have an account?{" "}
              <Link href="/login" className="underline underline-offset-2 text-lipi-text font-semibold">
                Sign in
              </Link>
            </p>
          </div>

          {/* Google button */}
          <motion.button
            onClick={handleGoogle}
            whileHover={{ x: -2, y: -2, }}
            whileTap={{ x: 2, y: 2, }}
            className="w-full flex items-center justify-center gap-3 border-2 border-lipi-border bg-white px-4 py-3 mb-6 font-[family-name:var(--font-space-grotesk)] font-semibold text-sm rounded-[32px]"
            
          >
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </motion.button>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 border-t-2 border-lipi-border/30" />
            <span className="text-xs font-[family-name:var(--font-space-grotesk)] text-lipi-muted">or</span>
            <div className="flex-1 border-t-2 border-lipi-border/30" />
          </div>

          <form onSubmit={handleEmail} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold font-[family-name:var(--font-space-grotesk)] mb-1">Your name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Priya Sharma" className="input-brutal" />
            </div>
            <div>
              <label className="block text-xs font-semibold font-[family-name:var(--font-space-grotesk)] mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="hello@example.com" className="input-brutal" />
            </div>
            <div>
              <label className="block text-xs font-semibold font-[family-name:var(--font-space-grotesk)] mb-1">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters" className="input-brutal" />
            </div>

            {(formError || error) && (
              <p className="text-red-600 text-xs font-[family-name:var(--font-space-grotesk)] border-2 border-red-300 bg-red-50 px-3 py-2">
                {formError || error}
              </p>
            )}

            <PillButton type="submit" variant="primary" size="md" className="w-full justify-center mt-2" disabled={loading}>
              {loading ? "Creating account..." : "Create account →"}
            </PillButton>

            <p className="text-xs text-lipi-muted text-center font-[family-name:var(--font-space-grotesk)]">
              Free plan · No credit card required
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
