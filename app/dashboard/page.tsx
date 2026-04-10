"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type GuestSession = {
  room_number: string;
  guest_name: string;
};

type Promo = {
  id: string;
  label: string;
  headline: string;
  sub: string;
  cta: string;
  href: string;
  active: boolean;
};

const NAV_ITEMS = [
  { key: "dining", title: "Dining", description: "Order food & drinks", icon: "🍽" },
  { key: "service", title: "Request Service", description: "Housekeeping & more", icon: "🔔" },
  { key: "spa", title: "Book Spa", description: "Treatments & wellness", icon: "🌿" },
  { key: "upgrade", title: "Upgrade Stay", description: "Room upgrades & perks", icon: "⭐" },
];

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<GuestSession | null>(null);
  const [promo, setPromo] = useState<Promo | null>(null);

  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem("suiteluxe_guest_session") : null;
    if (!raw) { router.replace("/"); return; }
    try {
      const data = JSON.parse(raw);
      setSession({ room_number: data.room_number, guest_name: data.guest_name });
    } catch { router.replace("/"); }
  }, [router]);

  useEffect(() => {
    const loadPromo = async () => {
      const { data } = await supabase
        .from("promos")
        .select("*")
        .eq("active", true)
        .limit(1)
        .single();
      if (data) setPromo(data as Promo);
    };
    loadPromo();
  }, []);

  const handleSignOut = () => {
    if (typeof window !== "undefined") localStorage.removeItem("suiteluxe_guest_session");
    router.replace("/");
  };

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: "#0D1B2A" }}>
        <p className="text-white/80">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col px-6 py-8 sm:px-10" style={{ backgroundColor: "#0D1B2A" }}>

      {/* Header */}
      <header className="mx-auto flex w-full max-w-5xl flex-col gap-1">
        <h1 className="text-3xl font-normal text-white sm:text-4xl" style={{ fontFamily: "Georgia, serif" }}>
          Welcome, {session.guest_name}
        </h1>
        <p className="text-sm font-medium uppercase tracking-[0.25em]" style={{ color: "#C9993F" }}>
          Room {session.room_number}
        </p>
      </header>

      <main className="mx-auto mt-8 w-full max-w-5xl flex-1 space-y-8">

        {/* Promo banner */}
        {promo && (
          <section
            className="relative overflow-hidden rounded-2xl p-6 sm:p-7"
            style={{
              background: "linear-gradient(135deg, #1e1506 0%, #2a1f08 50%, #1a1208 100%)",
              border: "1px solid rgba(201,153,63,0.4)",
            }}
          >
            <div
              className="pointer-events-none absolute -top-10 -right-10 h-48 w-48 rounded-full opacity-20"
              style={{ background: "radial-gradient(circle, #C9993F 0%, transparent 70%)" }}
            />
            <div className="absolute top-3 right-3 h-4 w-4">
              <div className="absolute top-0 right-0 h-full w-px" style={{ backgroundColor: "#C9993F", opacity: 0.7 }} />
              <div className="absolute top-0 right-0 h-px w-full" style={{ backgroundColor: "#C9993F", opacity: 0.7 }} />
            </div>
            <div className="absolute bottom-3 left-3 h-4 w-4">
              <div className="absolute bottom-0 left-0 h-full w-px" style={{ backgroundColor: "#C9993F", opacity: 0.7 }} />
              <div className="absolute bottom-0 left-0 h-px w-full" style={{ backgroundColor: "#C9993F", opacity: 0.7 }} />
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.4em]" style={{ color: "#C9993F" }}>
                  ✦ &nbsp;{promo.label}
                </p>
                <h2 className="mt-2 text-2xl font-light text-white sm:text-3xl" style={{ fontFamily: "Georgia, serif" }}>
                  {promo.headline}
                </h2>
                <p className="mt-2 max-w-md text-sm text-white/50">{promo.sub}</p>
              </div>
              <button
                type="button"
                onClick={() => router.push(promo.href)}
                className="shrink-0 rounded-full px-6 py-3 text-xs font-semibold uppercase tracking-widest text-[#0D1B2A] transition hover:opacity-90"
                style={{ backgroundColor: "#C9993F" }}
              >
                {promo.cta}
              </button>
            </div>
          </section>
        )}

        {/* Tiles */}
        <div className="grid w-full gap-6 sm:grid-cols-2">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => router.push(`/${item.key}`)}
              className="group flex h-40 w-full flex-col justify-between rounded-2xl bg-[#162233] px-6 py-5 text-left text-white shadow-lg outline-none transition-transform hover:scale-[1.02] hover:shadow-2xl focus-visible:ring-2 focus-visible:ring-[#C9993F] sm:h-48 lg:h-56"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full text-2xl" style={{ color: "#C9993F", backgroundColor: "#0D1B2A" }}>
                    <span aria-hidden="true">{item.icon}</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold sm:text-xl">{item.title}</h2>
                    <p className="mt-1 text-sm text-white/70 sm:text-base">{item.description}</p>
                  </div>
                </div>
                <span className="text-2xl font-semibold text-[#C9993F] transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
              </div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/40">Select to continue</p>
            </button>
          ))}
        </div>
      </main>

      {/* Sign out */}
      <footer className="mx-auto mt-8 w-full max-w-5xl text-right">
        <button
          type="button"
          onClick={handleSignOut}
          className="text-xs font-medium uppercase tracking-[0.18em] text-white/60 underline-offset-4 hover:text-white hover:underline"
        >
          Sign Out
        </button>
      </footer>
    </div>
  );
}