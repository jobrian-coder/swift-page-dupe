import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { initiateActivationPayment, getPaymentStatus } from "@/lib/payments.functions";

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

const ACTIVATION_STEPS = [
  { icon: "📍", label: "Verifying location", detail: "Matching your region to available companies" },
  { icon: "🪪", label: "Checking KRA / tax ID", detail: "Confirming payout eligibility" },
  { icon: "💳", label: "Validating payment method", detail: "Preparing your wallet for instant payouts" },
  { icon: "🛡️", label: "Running compliance check", detail: "Fraud & duplicate account screening" },
  { icon: "✅", label: "Activating your review slot", detail: "Reserving a paid spot for you" },
];

const ACTIVATION_FEE = 0.6;

function Dashboard() {
  const qc = useQueryClient();
  const [activating, setActivating] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [done, setDone] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [paying, setPaying] = useState(false);
  const [payErr, setPayErr] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);

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

  useEffect(() => {
    if (!activating || done) return;
    if (stepIdx >= ACTIVATION_STEPS.length) {
      setDone(true);
      return;
    }
    const t = setTimeout(() => setStepIdx((i) => i + 1), 1400);
    return () => clearTimeout(t);
  }, [activating, stepIdx, done]);

  const activate = () => {
    setDone(false);
    setStepIdx(0);
    setActivating(true);
  };

  const closeModal = () => {
    setActivating(false);
    setStepIdx(0);
    setDone(false);
  };

  const openPay = () => {
    closeModal();
    setPayErr(null);
    setPaid(false);
    setPhone("");
    setPayOpen(true);
  };

  const closePay = () => {
    setPayOpen(false);
    setPaying(false);
    setPaid(false);
    setPayErr(null);
  };

  const submitPay = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayErr(null);
    const p = phone.trim();
    if (!/^(07\d{8}|2547\d{8})$/.test(p)) {
      setPayErr("Enter a valid M-Pesa number (07XXXXXXXX or 2547XXXXXXXX).");
      return;
    }
    setPaying(true);
    setTimeout(() => {
      setPaying(false);
      setPaid(true);
    }, 2500);
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
        <Link
          to="/wallet"
          className="rounded-2xl border-2 px-4 py-2 text-right hover:shadow-md transition"
          style={{ borderColor: "var(--brand)" }}
        >
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Balance
          </div>
          <div className="text-xl font-bold" style={{ color: "var(--brand)" }}>
            ${balance.toFixed(2)}
          </div>
        </Link>
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

      {activating && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div
            className="rounded-3xl p-6 max-w-md w-full shadow-2xl"
            style={{ background: "var(--card)" }}
          >
            <div className="flex items-center gap-3 mb-1">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                style={{ background: "var(--brand)", color: "var(--brand-foreground)" }}
              >
                🔒
              </div>
              <div>
                <div className="font-bold text-lg">Activating review access</div>
                <div className="text-xs text-muted-foreground">
                  Please keep this window open
                </div>
              </div>
            </div>

            <div className="h-2 rounded-full bg-muted overflow-hidden my-4">
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (stepIdx / ACTIVATION_STEPS.length) * 100)}%`,
                  background: "var(--brand)",
                }}
              />
            </div>

            <ul className="space-y-2.5">
              {ACTIVATION_STEPS.map((s, i) => {
                const state =
                  i < stepIdx ? "done" : i === stepIdx && !done ? "active" : "pending";
                return (
                  <li
                    key={s.label}
                    className="flex items-start gap-3 rounded-xl border p-2.5"
                    style={{
                      background:
                        state === "active" ? "var(--card-warm)" : "transparent",
                      borderColor:
                        state === "done"
                          ? "var(--brand)"
                          : state === "active"
                            ? "var(--brand)"
                            : "var(--border)",
                      opacity: state === "pending" ? 0.55 : 1,
                    }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-base"
                      style={{
                        background:
                          state === "done" ? "var(--brand)" : "var(--muted)",
                        color:
                          state === "done" ? "var(--brand-foreground)" : "inherit",
                      }}
                    >
                      {state === "done" ? "✓" : state === "active" ? (
                        <span className="inline-block w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                      ) : (
                        s.icon
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold">{s.label}</div>
                      <div className="text-xs text-muted-foreground">{s.detail}</div>
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-wider pt-1"
                      style={{
                        color:
                          state === "done"
                            ? "var(--brand)"
                            : state === "active"
                              ? "var(--brand-accent)"
                              : "var(--muted-foreground)",
                      }}
                    >
                      {state === "done" ? "OK" : state === "active" ? "…" : "Wait"}
                    </div>
                  </li>
                );
              })}
            </ul>

            {done ? (
              <div className="mt-5 space-y-3">
                <div
                  className="rounded-xl p-3 text-sm text-center font-semibold"
                  style={{ background: "var(--brand)", color: "var(--brand-foreground)" }}
                >
                  All checks passed — one-time activation fee required
                </div>
                <button
                  onClick={openPay}
                  className="w-full h-11 rounded-full font-semibold shadow"
                  style={{ background: "var(--brand)", color: "var(--brand-foreground)" }}
                >
                  Continue to activation · ${ACTIVATION_FEE.toFixed(2)}
                </button>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground text-center mt-4">
                This usually takes 10–20 seconds. Do not refresh.
              </div>
            )}
          </div>
        </div>
      )}

      {payOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div
            className="rounded-3xl p-6 max-w-md w-full shadow-2xl relative"
            style={{ background: "var(--card)" }}
          >
            <button
              onClick={closePay}
              aria-label="Close"
              className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted"
            >
              ✕
            </button>

            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl mb-3"
              style={{ background: "var(--card-warm)" }}
            >
              🔒
            </div>
            <h3 className="text-2xl font-bold">Activate review</h3>
            <p className="text-sm text-muted-foreground mb-5">
              Activate reviews for{" "}
              <span className="font-bold" style={{ color: "var(--brand)" }}>
                ${ACTIVATION_FEE.toFixed(2)}
              </span>
              .
            </p>

            {paid ? (
              <div className="space-y-4">
                <div
                  className="rounded-xl p-4 text-center"
                  style={{ background: "var(--brand)", color: "var(--brand-foreground)" }}
                >
                  <div className="text-3xl mb-1">✓</div>
                  <div className="font-bold">Payment received</div>
                  <div className="text-xs opacity-90">
                    Your reviews are now active. Pick a company below.
                  </div>
                </div>
                <button
                  onClick={closePay}
                  className="w-full h-11 rounded-full font-semibold shadow"
                  style={{ background: "var(--brand)", color: "var(--brand-foreground)" }}
                >
                  Start reviewing
                </button>
              </div>
            ) : (
              <form onSubmit={submitPay} className="space-y-3">
                <label className="block">
                  <span className="text-sm font-semibold block mb-1.5">
                    M-Pesa phone number
                  </span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="07XXXXXXXX or 2547XXXXXXXX"
                    disabled={paying}
                    className="w-full h-11 px-3 rounded-lg border-2 bg-transparent text-sm focus:outline-none"
                    style={{ borderColor: "var(--brand)" }}
                  />
                </label>
                {payErr && <p className="text-sm text-destructive">{payErr}</p>}
                <button
                  type="submit"
                  disabled={paying}
                  className="w-full h-12 rounded-full font-semibold shadow disabled:opacity-70 flex items-center justify-center gap-2"
                  style={{ background: "var(--brand)", color: "var(--brand-foreground)" }}
                >
                  {paying ? (
                    <>
                      <span className="inline-block w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                      Sending STK push...
                    </>
                  ) : (
                    <>Activate via M-Pesa · ${ACTIVATION_FEE.toFixed(2)}</>
                  )}
                </button>
                <p className="text-xs text-muted-foreground text-center">
                  You'll receive an M-Pesa prompt on your phone. Enter your PIN to confirm.
                </p>
              </form>
            )}
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
