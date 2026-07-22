import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — RatePay" },
      { name: "description", content: "Pick a company, write an honest review, get paid instantly." },
      { property: "og:title", content: "Dashboard — RatePay" },
      { property: "og:description", content: "Pick a company, write an honest review, get paid instantly." },
    ],
  }),
  component: () => (
    <AuthGate>
      <Dashboard />
    </AuthGate>
  ),
});

function Dashboard() {
  const qc = useQueryClient();
  const [activating, setActivating] = useState(false);
  const [checking, setChecking] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("username, balance, earned, reviews_active")
        .single();
      return data;
    },
  });

  const { data: companies } = useQuery({
    queryKey: ["companies-preview"],
    queryFn: async () => {
      const { data } = await supabase
        .from("companies")
        .select("*")
        .order("name")
        .limit(6);
      return data ?? [];
    },
  });

  const { data: reviewCount } = useQuery({
    queryKey: ["review-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("reviews")
        .select("id", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: openCount } = useQuery({
    queryKey: ["open-count"],
    queryFn: async () => {
      const { data } = await supabase.from("companies").select("id,taken_spots,total_spots");
      return (data ?? []).filter((c) => c.taken_spots < c.total_spots).length;
    },
  });

  const activate = async () => {
    setActivating(true);
    setTimeout(async () => {
      setChecking(true);
      setTimeout(async () => {
        setActivating(false);
        setChecking(false);
      }, 2000);
    }, 1500);
  };

  const balance = Number(profile?.balance ?? 0);
  const earned = Number(profile?.earned ?? 0);

  return (
    <div className="space-y-6">
      <div
        className="rounded-2xl border p-4 flex items-center justify-between gap-4"
        style={{ background: "oklch(0.98 0.05 85)", borderColor: "oklch(0.85 0.1 85)" }}
      >
        <div>
          <div className="font-bold">Reviews inactive</div>
          <div className="text-sm text-muted-foreground">Activate reviews to continue</div>
        </div>
        <button
          onClick={activate}
          className="px-4 py-2 rounded-full text-sm font-semibold shadow"
          style={{ background: "var(--brand)", color: "var(--brand-foreground)" }}
        >
          Activate review
        </button>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            Hi,{" "}
            <span style={{ color: "var(--brand)" }}>{profile?.username}</span>
          </h1>
          <p className="text-muted-foreground">Review a company and get paid instantly</p>
        </div>
        <div
          className="rounded-2xl border-2 px-4 py-2 text-right"
          style={{ borderColor: "var(--brand)" }}
        >
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Balance
          </div>
          <div className="text-xl font-bold" style={{ color: "var(--brand)" }}>
            ${balance.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          highlight
          label="Balance"
          value={`$${balance.toFixed(2)}`}
          sub={`$${balance.toFixed(2)} to $20`}
        />
        <StatCard label="Earned" value={`$${earned.toFixed(2)}`} />
        <StatCard label="Reviews" value={String(reviewCount ?? 0)} />
        <StatCard label="Open" value={String(openCount ?? 0)} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xl font-bold">Start reviewing</h2>
            <p className="text-sm text-muted-foreground">
              {openCount ?? 0} companies · tap one to earn
            </p>
          </div>
          <Link
            to="/companies"
            className="text-sm font-semibold"
            style={{ color: "var(--brand)" }}
          >
            See all
          </Link>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {(companies ?? []).map((c) => (
            <CompanyCard key={c.id} c={c} />
          ))}
        </div>
      </div>

      <Link
        to="/companies"
        className="block text-center rounded-2xl border py-4"
        style={{ background: "var(--card-warm)" }}
      >
        <div className="font-semibold">See all companies</div>
        <div className="text-xs text-muted-foreground">+more available</div>
      </Link>

      <div className="rounded-2xl border p-6" style={{ background: "var(--card)" }}>
        <h3 className="font-bold text-lg mb-4">How it works</h3>
        <ol className="space-y-4">
          {[
            ["Pick a company", "Choose from the list above or browse all open slots."],
            ["Write an honest review", "Rate 1–5 stars and share at least 30 characters."],
            ["Get paid instantly", "The reward on the card goes to your wallet right away."],
            ["Withdraw at $20+", "PayPal, Venmo, Cash App, or bank once you hit $20."],
          ].map(([t, d], i) => (
            <li key={i} className="flex gap-3">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
              >
                {i + 1}
              </div>
              <div>
                <div className="font-semibold">{t}</div>
                <div className="text-sm text-muted-foreground">{d}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {(activating || checking) && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-card rounded-2xl p-6 max-w-sm w-full text-center">
            <div className="text-2xl mb-2">🔒</div>
            <div className="font-bold text-lg">Activate review</div>
            <div className="text-sm text-muted-foreground mb-4">
              Running security &amp; compliance checks...
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden mb-4">
              <div
                className="h-full transition-all"
                style={{
                  width: checking ? "90%" : "40%",
                  background: "var(--brand)",
                }}
              />
            </div>
            <div className="text-sm">
              {checking ? "Checking payment..." : "Verifying account..."}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              This may take a few seconds
            </div>
          </div>
        </div>
      )}
      {void qc}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className="rounded-2xl border p-4"
      style={{
        background: highlight ? "var(--brand)" : "var(--card)",
        color: highlight ? "var(--brand-foreground)" : "var(--foreground)",
      }}
    >
      <div className="text-[10px] uppercase tracking-wider opacity-70">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
      {sub && <div className="text-xs opacity-70">{sub}</div>}
    </div>
  );
}

function CompanyCard({ c }: { c: any }) {
  const pct = Math.round((c.taken_spots / c.total_spots) * 100);
  return (
    <Link
      to="/review/$id"
      params={{ id: c.id }}
      className="rounded-2xl border p-4 flex flex-col gap-2 hover:shadow-md transition"
      style={{ background: "var(--card)" }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
          style={{ background: c.color + "22" }}
        >
          {c.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="font-bold truncate">{c.name}</div>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
            >
              Earn ${Number(c.payout).toFixed(2)}
            </span>
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {c.location} · {c.industry}
          </div>
        </div>
        <span
          className="text-xs font-semibold px-3 py-1.5 rounded-full border"
          style={{ borderColor: "var(--brand)", color: "var(--brand)" }}
        >
          Activate
        </span>
      </div>
      <div className="flex items-center gap-2">
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
    </Link>
  );
}
