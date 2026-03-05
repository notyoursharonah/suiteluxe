"use client";

import { useEffect, useState } from "react";
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
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
  }, []);

  return (
    <div
      className="min-h-screen px-4 py-6 sm:px-8 sm:py-8"
      style={{ backgroundColor: "#0D1B2A" }}
    >
      <header className="mx-auto w-full max-w-6xl">
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
      </header>

      <main className="mx-auto mt-8 w-full max-w-6xl">
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
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

