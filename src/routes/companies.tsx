import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthGate } from "@/components/AuthGate";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { CompanyLogo } from "@/components/CompanyLogo";

export const Route = createFileRoute("/companies")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Companies — ReviewSasa" },
      { name: "description", content: "Browse US companies and get paid a fixed reward per review." },
      { property: "og:title", content: "Companies — ReviewSasa" },
      { property: "og:description", content: "Browse US companies and get paid a fixed reward per review." },
    ],
  }),
  component: () => (
    <AuthGate>
      <Companies />
    </AuthGate>
  ),
});

function Companies() {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [industry, setIndustry] = useState("all");
  const [availableOnly, setAvailableOnly] = useState(true);

  const { data: companies } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const { data } = await supabase.from("companies").select("*").order("name");
      return data ?? [];
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  const industries = useMemo(() => {
    const set = new Set((companies ?? []).map((c) => c.industry));
    return Array.from(set).sort();
  }, [companies]);

  const filtered = (companies ?? []).filter((c) => {
    const matchesQ = (c.name + " " + c.industry + " " + c.location).toLowerCase().includes(q.toLowerCase());
    const matchesInd = industry === "all" || c.industry === industry;
    const matchesAvail = !availableOnly || c.taken_spots < c.total_spots;
    return matchesQ && matchesInd && matchesAvail;
  });

  const active = !!profile?.reviews_active;

  return (
    <div className="space-y-6">
      {!active && (
        <div
          className="rounded-2xl border p-4 md:p-5 flex items-center justify-between gap-4 flex-wrap"
          style={{ background: "color-mix(in oklab, var(--accent) 25%, var(--card))", borderColor: "color-mix(in oklab, var(--accent) 50%, transparent)" }}
        >
          <div>
            <div className="font-bold text-lg">Reviews inactive</div>
            <div className="text-sm text-muted-foreground">Activate reviews to continue</div>
          </div>
          <Link
            to="/dashboard"
            className="h-11 px-6 rounded-full font-semibold inline-flex items-center"
            style={{ background: "var(--brand)", color: "var(--brand-foreground)" }}
          >
            Activate review
          </Link>
        </div>
      )}

      <div>
        <div className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--accent-foreground-strong, #c2410c)" }}>
          US Companies
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold mt-2 tracking-tight">Find a company to review</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Get paid a fixed reward per company instantly. Each company accepts up to 200 reviews.
        </p>
      </div>

      <div className="rounded-2xl border p-4 md:p-5 grid gap-4 md:grid-cols-[1fr_260px_auto] items-end" style={{ background: "var(--card)" }}>
        <label className="block">
          <div className="text-sm font-semibold mb-1.5">Search</div>
          <input
            placeholder="Name, city, state, or industry…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full h-11 px-4 rounded-xl border bg-transparent"
          />
        </label>
        <label className="block">
          <div className="text-sm font-semibold mb-1.5">Industry</div>
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="w-full h-11 px-3 rounded-xl border bg-transparent"
          >
            <option value="all">All industries</option>
            {industries.map((i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
        </label>
        <label className="inline-flex items-center gap-2 text-sm font-medium h-11 whitespace-nowrap">
          <input
            type="checkbox"
            checked={availableOnly}
            onChange={(e) => setAvailableOnly(e.target.checked)}
            className="w-4 h-4 accent-[var(--brand)]"
          />
          Available for me only
        </label>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map((c) => {
          const pct = Math.round((c.taken_spots / c.total_spots) * 100);
          const full = c.taken_spots >= c.total_spots;
          return (
            <div
              key={c.id}
              className="rounded-2xl border p-5 flex flex-col gap-3"
              style={{ background: "var(--card)" }}
            >
              <div className="flex items-start gap-3">
                <CompanyLogo name={c.name} emoji={c.emoji} color={c.color} size={48} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="font-bold text-lg leading-tight">{c.name}</div>
                    <span
                      className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: "color-mix(in oklab, var(--brand) 15%, transparent)",
                        color: "var(--brand)",
                      }}
                    >
                      Earn ${Number(c.payout).toFixed(2)}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-0.5">
                    {c.location} · {c.industry}
                  </div>
                </div>
                {full ? (
                  <span className="text-sm font-semibold px-4 py-2 rounded-full border text-muted-foreground">
                    Full
                  </span>
                ) : active ? (
                  <Link
                    to="/review/$id"
                    params={{ id: c.id }}
                    className="text-sm font-semibold px-4 py-2 rounded-full border hover:bg-muted transition"
                  >
                    Activate
                  </Link>
                ) : (
                  <Link
                    to="/dashboard"
                    search={{ activate: 1 } as any}
                    className="text-sm font-semibold px-4 py-2 rounded-full border hover:bg-muted transition"
                  >
                    Activate
                  </Link>
                )}

              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full"
                    style={{ width: `${pct}%`, background: "var(--brand)" }}
                  />
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  {c.taken_spots}/{c.total_spots} spots
                </div>
              </div>

              {"description" in c && (c as any).description ? (
                <p className="text-sm text-muted-foreground">{(c as any).description}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {c.industry} company based in {c.location}.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
