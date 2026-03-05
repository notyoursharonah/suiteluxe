"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== "suiteluxe2024") {
      setError("Incorrect password");
      return;
    }

    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("admin_authenticated", "true");
      }
      setLoading(true);
      router.replace("/admin");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ backgroundColor: "#0D1B2A" }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-[#162233] px-6 py-8 text-center text-white shadow-xl">
        <h1
          className="text-2xl font-normal sm:text-3xl"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Admin Access
        </h1>
        <p
          className="mt-1 text-xs font-medium uppercase tracking-[0.25em]"
          style={{ color: "#C9993F" }}
        >
          Staff only
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-left">
          <div>
            <label
              htmlFor="admin-password"
              className="mb-1.5 block text-xs font-medium uppercase tracking-[0.18em] text-white/70"
            >
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 outline-none transition focus:border-[#C9993F] focus:ring-1 focus:ring-[#C9993F]"
              placeholder="Enter admin password"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <button
            type="submit"
            className="mt-2 w-full rounded-full px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-[0.2em] text-[#0D1B2A] outline-none transition hover:opacity-95"
            style={{ backgroundColor: "#C9993F" }}
          >
            {loading ? "Entering…" : "Enter Dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
}

