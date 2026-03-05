"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type UpgradeOption = {
  id: string;
  title: string;
  description: string;
  priceLabel: string;
};

const UPGRADE_OPTIONS: UpgradeOption[] = [
  {
    id: "ocean-view",
    title: "Ocean View Room",
    description: "Stunning views of the ocean",
    priceLabel: "$75/night extra",
  },
  {
    id: "junior-suite",
    title: "Junior Suite",
    description: "Extra space and luxury amenities",
    priceLabel: "$120/night extra",
  },
  {
    id: "penthouse-suite",
    title: "Penthouse Suite",
    description: "The ultimate luxury experience",
    priceLabel: "$350/night extra",
  },
  {
    id: "early-check-in",
    title: "Early Check-in",
    description: "Check in from 10am",
    priceLabel: "$40 one-time",
  },
];

export default function UpgradePage() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = () => {
    if (!selectedId) return;
    setConfirmed(true);
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
            Upgrade Your Stay
          </h1>
          <p
            className="text-xs font-medium uppercase tracking-[0.25em]"
            style={{ color: "#C9993F" }}
          >
            Make it unforgettable
          </p>
        </div>
      </header>

      {/* Upgrade options */}
      <main className="mx-auto mt-8 flex w-full max-w-5xl flex-1 flex-col">
        <div className="grid gap-5 sm:grid-cols-2">
          {UPGRADE_OPTIONS.map((option) => {
            const isSelected = option.id === selectedId;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  setConfirmed(false);
                  setSelectedId(option.id);
                }}
                className={`flex h-full flex-col justify-between rounded-2xl bg-[#162233] p-5 text-left text-white shadow-lg outline-none transition hover:scale-[1.02] hover:shadow-2xl focus-visible:ring-2 focus-visible:ring-[#C9993F] ${
                  isSelected ? "border-2 border-[#C9993F]" : "border border-transparent"
                }`}
              >
                <div>
                  <h2 className="text-lg font-semibold sm:text-xl">
                    {option.title}
                  </h2>
                  <p className="mt-2 text-sm text-white/70">
                    {option.description}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span
                    className="text-sm font-semibold"
                    style={{ color: "#C9993F" }}
                  >
                    {option.priceLabel}
                  </span>
                  <span className="rounded-full bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                    Select
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </main>

      {/* Confirm button and message */}
      <footer className="mx-auto mt-8 w-full max-w-5xl">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!selectedId}
          className="w-full rounded-full px-6 py-2.5 text-center text-xs font-semibold uppercase tracking-[0.2em] text-[#0D1B2A] outline-none transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          style={{ backgroundColor: "#C9993F" }}
        >
          Confirm Upgrade
        </button>

        {confirmed && (
          <p className="mt-3 text-sm text-emerald-300">
            Your upgrade has been confirmed. Charges will appear on your room
            bill.
          </p>
        )}
      </footer>
    </div>
  );
}

