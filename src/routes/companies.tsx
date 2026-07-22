import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthGate } from "@/components/AuthGate";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export const Route = createFileRoute("/companies")({
  head: () => ({
    meta: [
      { title: "Companies — RatePay" },
      { name: "description", content: "Browse companies and earn rewards for reviewing each one." },
      { property: "og:title", content: "Companies — RatePay" },
      { property: "og:description", content: "Browse companies and earn rewards for reviewing each one." },
    ],
  }),
  component: () => (
    <AuthGate>
      <Companies />
    </AuthGate>
  ),
});

function Companies() {
  const [q, setQ] = useState("");
  const { data } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const { data } = await supabase.from("companies").select("*").order("name");
      return data ?? [];
    },
  });
  const filtered = (data ?? []).filter((c) =>
    (c.name + c.industry + c.location).toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Companies</h1>
      <input
        placeholder="Search companies..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="w-full h-11 px-4 rounded-full border bg-transparent"
      />
      <div className="grid md:grid-cols-2 gap-3">
        {filtered.map((c) => {
          const pct = Math.round((c.taken_spots / c.total_spots) * 100);
          const full = c.taken_spots >= c.total_spots;
          return (
            <Link
              key={c.id}
              to="/review/$id"
              params={{ id: c.id }}
              className="rounded-2xl border p-4 hover:shadow-md transition"
              style={{ background: "var(--card)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                  style={{ background: c.color + "22" }}
                >
                  {c.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="font-bold">{c.name}</div>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: "var(--accent)",
                        color: "var(--accent-foreground)",
                      }}
                    >
                      Earn ${Number(c.payout).toFixed(2)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {c.location} · {c.industry}
                  </div>
                </div>
                <span
                  className="text-xs font-semibold px-3 py-1.5 rounded-full"
                  style={{
                    background: full ? "var(--muted)" : "var(--brand)",
                    color: full ? "var(--muted-foreground)" : "var(--brand-foreground)",
                  }}
                >
                  {full ? "Full" : "Activate"}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full"
                    style={{ width: `${pct}%`, background: "var(--brand)" }}
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  {c.taken_spots}/{c.total_spots} spots
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
