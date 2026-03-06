"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function StaffLoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: queryError } = await supabase
      .from("staff")
      .select("*")
      .ilike("name", name.trim())
      .eq("pin", pin.trim())
      .single();

    if (queryError || !data) {
      setError("Name or PIN not found. Please try again.");
      setLoading(false);
      return;
    }

    localStorage.setItem("suiteluxe_staff_session", JSON.stringify({
      id: data.id,
      name: data.name,
      role: data.role,
    }));

    router.push("/staff/portal");
    setLoading(false);
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4"
      style={{ backgroundColor: "#0D1B2A" }}
    >
      <div className="w-full max-w-sm text-center">
        <h1
          className="text-4xl font-normal tracking-wide"
          style={{ fontFamily: "Georgia, serif" }}
        >
          <span className="text-white">SUITE</span>
          <span style={{ color: "#C9993F" }}>LUXE</span>
        </h1>
        <p className="mt-2 text-xs uppercase tracking-widest" style={{ color: "#C9993F" }}>
          Staff Portal
        </p>

        <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-5">
          <div>
            <label className="mb-1.5 block text-left text-xs font-medium uppercase tracking-wider text-white/80">
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/40 outline-none transition focus:border-[#C9993F] focus:ring-1 focus:ring-[#C9993F]"
              placeholder="e.g. Maria Lopez"
              disabled={loading}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-left text-xs font-medium uppercase tracking-wider text-white/80">
              PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={8}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              required
              className="w-full rounded border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/40 outline-none transition focus:border-[#C9993F] focus:ring-1 focus:ring-[#C9993F]"
              placeholder="Your staff PIN"
              disabled={loading}
            />
          </div>

          {error && <p className="text-left text-sm text-amber-300/90">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded py-3.5 font-medium uppercase tracking-widest text-[#0D1B2A] transition hover:opacity-95 disabled:opacity-70"
            style={{ backgroundColor: "#C9993F" }}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}