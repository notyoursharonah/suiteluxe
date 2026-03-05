"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type AdminOrderItem = {
  item_name: string;
  price: number;
  quantity: number;
  category?: string | null;
};

type AdminOrder = {
  id: string;
  total: number;
  status: string;
  created_at: string;
  guest_sessions: {
    room_number: string;
    guest_name: string;
  } | null;
  order_items: AdminOrderItem[];
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const authed = localStorage.getItem("admin_authenticated");
      if (authed !== "true") {
        router.replace("/admin/login");
        return;
      }
    }

    const loadOrders = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: queryError } = await supabase
          .from("orders")
          .select(
            `
              id,
              total,
              status,
              created_at,
              guest_sessions:session_id (
                room_number,
                guest_name
              ),
              order_items (
                item_name,
                price,
                quantity,
                category
              )
            `
          )
          .order("created_at", { ascending: false });

        if (queryError) {
          throw queryError;
        }

        setOrders((data as AdminOrder[]) ?? []);
      } catch (e) {
        console.error("[SuiteLuxe] Failed to load admin orders:", e);
        setError("Unable to load orders. Please refresh.");
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [router]);

  const todayStats = (() => {
    const now = new Date();
    const isToday = (iso: string) => {
      const d = new Date(iso);
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    };

    const todaysOrders = orders.filter((o) => isToday(o.created_at));
    const revenue = todaysOrders.reduce(
      (sum, o) => sum + Number(o.total || 0),
      0
    );
    const count = todaysOrders.length;
    const average = count > 0 ? revenue / count : 0;

    return { revenue, count, average };
  })();

  const handleUpdateStatus = async (orderId: string, nextStatus: string) => {
    try {
      setUpdatingId(orderId);
      const { error: updateError } = await supabase
        .from("orders")
        .update({ status: nextStatus })
        .eq("id", orderId);

      if (updateError) {
        throw updateError;
      }

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: nextStatus } : order
        )
      );
    } catch (e) {
      console.error("[SuiteLuxe] Failed to update order status:", e);
      setError("Unable to update order status. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div
      className="min-h-screen px-4 py-6 sm:px-8 sm:py-8"
      style={{ backgroundColor: "#0D1B2A" }}
    >
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between">
        <div>
          <h1
            className="text-2xl font-normal text-white sm:text-3xl"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Admin Dashboard
          </h1>
          <p
            className="mt-1 text-xs font-medium uppercase tracking-[0.25em]"
            style={{ color: "#C9993F" }}
          >
            Live Orders
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined") {
              localStorage.removeItem("admin_authenticated");
            }
            router.replace("/admin/login");
          }}
          className="rounded-full border border-white/25 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white outline-none transition hover:border-[#C9993F] hover:text-[#C9993F]"
        >
          Sign Out
        </button>
      </header>

      <main className="mx-auto mt-8 w-full max-w-6xl">
        {/* Revenue summary */}
        <section className="grid gap-4 sm:grid-cols-3">
          <div
            className="rounded-2xl px-4 py-3"
            style={{ backgroundColor: "#162233" }}
          >
            <p
              className="text-lg font-semibold"
              style={{ color: "#C9993F" }}
            >
              ${todayStats.revenue.toFixed(2)}
            </p>
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-white/70">
              Today&apos;s Revenue
            </p>
          </div>
          <div
            className="rounded-2xl px-4 py-3"
            style={{ backgroundColor: "#162233" }}
          >
            <p
              className="text-lg font-semibold"
              style={{ color: "#C9993F" }}
            >
              {todayStats.count}
            </p>
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-white/70">
              Today&apos;s Orders
            </p>
          </div>
          <div
            className="rounded-2xl px-4 py-3"
            style={{ backgroundColor: "#162233" }}
          >
            <p
              className="text-lg font-semibold"
              style={{ color: "#C9993F" }}
            >
              ${todayStats.average.toFixed(2)}
            </p>
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-white/70">
              Avg Order Value
            </p>
          </div>
        </section>

        {/* States */}
        {loading && (
          <p className="text-sm text-white/70">Loading orders…</p>
        )}

        {error && !loading && (
          <p className="text-sm text-red-400">{error}</p>
        )}

        {!loading && !error && orders.length === 0 && (
          <p className="text-sm text-white/60">
            No orders have been placed yet.
          </p>
        )}

        <div className="mt-4 grid gap-5 md:grid-cols-2">
          {orders.map((order) => {
            const guest = order.guest_sessions;
            const createdAt = new Date(order.created_at);
            const timeString = createdAt.toLocaleTimeString(undefined, {
              hour: "numeric",
              minute: "2-digit",
            });

            return (
              <div
                key={order.id}
                className="flex flex-col rounded-2xl bg-[#162233] p-5 text-white shadow-lg"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white/70">
                      Room {guest?.room_number ?? "—"}
                    </p>
                    <p className="text-base font-semibold">
                      {guest?.guest_name ?? "Unknown guest"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "#C9993F" }}
                    >
                      ${Number(order.total).toFixed(2)}
                    </p>
                    <p className="mt-1 text-xs text-white/60">
                      {timeString}
                    </p>
                  </div>
                </div>

                <div className="mt-4 border-t border-white/10 pt-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
                    Items
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-white/80">
                    {order.order_items?.map((item, index) => (
                      <li key={`${order.id}-${index}`} className="flex justify-between">
                        <span>
                          {item.item_name}
                          {item.quantity > 1 && (
                            <span className="text-white/50">
                              {" "}
                              ×{item.quantity}
                            </span>
                          )}
                        </span>
                        <span className="text-white/70">
                          ${Number(item.price).toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Status controls */}
                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                  <div>
                    {order.status === "pending" && (
                      <span className="rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-yellow-300">
                        Pending
                      </span>
                    )}
                    {order.status === "preparing" && (
                      <span className="rounded-full bg-orange-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-orange-300">
                        Preparing
                      </span>
                    )}
                    {order.status === "delivered" && (
                      <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                        Delivered
                      </span>
                    )}
                  </div>

                  <div>
                    {order.status === "pending" && (
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateStatus(order.id, "preparing")
                        }
                        disabled={updatingId === order.id}
                        className="rounded-full bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white outline-none transition hover:bg-white/10 disabled:opacity-60"
                      >
                        {updatingId === order.id
                          ? "Updating…"
                          : "Mark Preparing"}
                      </button>
                    )}
                    {order.status === "preparing" && (
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateStatus(order.id, "delivered")
                        }
                        disabled={updatingId === order.id}
                        className="rounded-full bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white outline-none transition hover:bg-white/10 disabled:opacity-60"
                      >
                        {updatingId === order.id
                          ? "Updating…"
                          : "Mark Delivered"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

