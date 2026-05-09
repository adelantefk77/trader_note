"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message === "Invalid login credentials"
        ? "Nieprawidłowy email lub hasło."
        : error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full" style={{ maxWidth: "28rem" }}>
        {/* Brand */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-on-surface tracking-tight">TraderNote</h1>
          <p className="font-mono text-xs text-on-surface-variant uppercase tracking-widest mt-2">
            Institutional Grade
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-8">
          <h2 className="text-xl font-semibold text-on-surface mb-1">Zaloguj się</h2>
          <p className="text-sm text-on-surface-variant mb-6">
            Prywatny system dziennika transakcyjnego.
          </p>

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div>
              <label className="block font-mono text-[10px] text-on-surface-variant uppercase mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="twoj@email.com"
                className="w-full bg-surface-container-highest border-b-2 border-outline-variant focus:border-primary px-3 py-3 text-on-surface font-mono text-sm outline-none rounded-t transition-colors"
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] text-on-surface-variant uppercase mb-2">
                Hasło
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full bg-surface-container-highest border-b-2 border-outline-variant focus:border-primary px-3 py-3 text-on-surface font-mono text-sm outline-none rounded-t transition-colors"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-error-container/20 border border-error/30 rounded-lg">
                <span className="material-symbols-outlined text-error text-[18px]">error</span>
                <p className="text-error text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-on-primary py-3 rounded-lg font-semibold text-sm hover:bg-primary-fixed-dim transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  Logowanie...
                </>
              ) : (
                "Zaloguj się"
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-outline-variant">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[16px]">shield</span>
              <p className="font-mono text-[10px] text-on-surface-variant">
                Prywatny system — rejestracja publiczna zablokowana.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
