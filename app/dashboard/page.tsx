"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type GuestSession = {
  room_number: string;
  guest_name: string;
};

const NAV_ITEMS = [
  {
    key: "dining",
    title: "Dining",
    description: "Order food & drinks",
    icon: "🍽",
  },
  {
    key: "service",
    title: "Request Service",
    description: "Housekeeping & more",
    icon: "🔔",
  },
  {
    key: "spa",
    title: "Book Spa",
    description: "Treatments & wellness",
    icon: "🌿",
  },
  {
    key: "upgrade",
    title: "Upgrade Stay",
    description: "Room upgrades & perks",
    icon: "⭐",
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<GuestSession | null>(null);

  useEffect(() => {
    const raw =
      typeof window !== "undefined"
        ? localStorage.getItem("suiteluxe_guest_session")
        : null;

    if (!raw) {
      router.replace("/");
      return;
    }

    try {
      const data = JSON.parse(raw);
      setSession({
        room_number: data.room_number,
        guest_name: data.guest_name,
      });
    } catch {
      router.replace("/");
    }
  }, [router]);

  const handleSignOut = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("suiteluxe_guest_session");
    }
    router.replace("/");
  };

  if (!session) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ backgroundColor: "#0D1B2A" }}
      >
        <p className="text-white/80">Loading…</p>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen flex-col px-6 py-8 sm:px-10"
      style={{ backgroundColor: "#0D1B2A" }}
    >
      {/* Header */}
      <header className="mx-auto flex w-full max-w-5xl flex-col gap-1">
        <h1
          className="text-3xl font-normal text-white sm:text-4xl"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Welcome, {session.guest_name}
        </h1>
        <p
          className="text-sm font-medium uppercase tracking-[0.25em]"
          style={{ color: "#C9993F" }}
        >
          Room {session.room_number}
        </p>
      </header>

      {/* Tiles */}
      <main className="mx-auto mt-10 flex w-full max-w-5xl flex-1 items-center">
        <div className="grid w-full gap-6 sm:grid-cols-2">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                if (item.key === "dining") {
                  router.push("/dining");
                } else if (item.key === "service") {
                  router.push("/service");
                } else if (item.key === "spa") {
                  router.push("/spa");
                } else if (item.key === "upgrade") {
                  router.push("/upgrade");
                }
              }}
              className="group flex h-40 w-full flex-col justify-between rounded-2xl bg-[#162233] px-6 py-5 text-left text-white shadow-lg outline-none transition-transform transition-shadow hover:scale-[1.02] hover:shadow-2xl focus-visible:ring-2 focus-visible:ring-[#C9993F] sm:h-48 lg:h-56"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-full text-2xl"
                    style={{ color: "#C9993F", backgroundColor: "#0D1B2A" }}
                  >
                    <span aria-hidden="true">{item.icon}</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold sm:text-xl">
                      {item.title}
                    </h2>
                    <p className="mt-1 text-sm text-white/70 sm:text-base">
                      {item.description}
                    </p>
                  </div>
                </div>
                <span
                  className="text-2xl font-semibold text-[#C9993F] transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                >
                  →
                </span>
              </div>

              <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                Select to continue
              </p>
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
