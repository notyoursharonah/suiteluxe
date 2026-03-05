"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ServiceOption = {
  id: string;
  label: string;
  icon: string;
};

const SERVICE_OPTIONS: ServiceOption[] = [
  { id: "extra-towels", label: "Extra Towels", icon: "🛁" },
  { id: "housekeeping", label: "Housekeeping", icon: "🧹" },
  { id: "room-maintenance", label: "Room Maintenance", icon: "🔧" },
  { id: "extra-pillows", label: "Extra Pillows", icon: "🛏" },
  { id: "ice-minibar", label: "Ice & Minibar", icon: "🧊" },
  { id: "wake-up-call", label: "Wake Up Call", icon: "⏰" },
];

export default function ServicePage() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!selectedId) return;
    setSubmitted(true);
  };

  return (
    <div
      className="flex min-h-screen flex-col px-4 py-6 sm:px-8 sm:py-8"
      style={{ backgroundColor: "#0D1B2A" }}
    >
      {/* Header with back */}
      <header className="mx-auto flex w-full max-w-5xl items-center gap-4">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 text-lg text-white/80 outline-none transition hover:border-[#C9993F] hover:text-white focus-visible:ring-2 focus-visible:ring-[#C9993F]"
          aria-label="Back to dashboard"
        >
          ←
        </button>
        <div className="flex flex-col">
          <h1
            className="text-2xl font-normal text-white sm:text-3xl"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Request Service
          </h1>
          <p
            className="text-xs font-medium uppercase tracking-[0.25em]"
            style={{ color: "#C9993F" }}
          >
            We'll be right with you
          </p>
        </div>
      </header>

      {/* Service options grid */}
      <main className="mx-auto mt-8 flex w-full max-w-5xl flex-1 flex-col">
        <div className="grid gap-5 sm:grid-cols-3">
          {SERVICE_OPTIONS.map((option) => {
            const isSelected = option.id === selectedId;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setSelectedId(option.id);
                }}
                className={`flex h-32 flex-col items-center justify-center rounded-2xl bg-[#162233] text-center text-white shadow-lg outline-none transition hover:scale-[1.02] hover:shadow-2xl focus-visible:ring-2 focus-visible:ring-[#C9993F] sm:h-40 ${
                  isSelected ? "border-2 border-[#C9993F]" : "border border-transparent"
                }`}
              >
                <span className="mb-2 text-3xl" aria-hidden="true">
                  {option.icon}
                </span>
                <span className="text-sm font-semibold sm:text-base">
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
      </main>

      {/* Submit button and message */}
      <footer className="mx-auto mt-8 w-full max-w-5xl">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!selectedId}
          className="w-full rounded-full px-6 py-2.5 text-center text-xs font-semibold uppercase tracking-[0.2em] text-[#0D1B2A] outline-none transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          style={{ backgroundColor: "#C9993F" }}
        >
          Submit Request
        </button>

        {submitted && (
          <p className="mt-3 text-sm text-emerald-300">
            Your request has been received. We'll be there within 20 minutes.
          </p>
        )}
      </footer>
    </div>
  );
}

