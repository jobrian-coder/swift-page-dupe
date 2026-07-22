import { createFileRoute } from "@tanstack/react-router";
import { AuthGate } from "@/components/AuthGate";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export const Route = createFileRoute("/wallet")({
  head: () => ({
    meta: [
      { title: "Wallet — RatePay" },
      { name: "description", content: "Track your balance and withdraw once you reach $20.00." },
      { property: "og:title", content: "Wallet — RatePay" },
      { property: "og:description", content: "Track your balance and withdraw once you reach $20.00." },
    ],
  }),
  component: () => (
    <AuthGate>
      <Wallet />
    </AuthGate>
  ),
});

const METHODS = [
  { id: "M-Pesa", label: "M-Pesa (default)", placeholder: "07XXXXXXXX or 2547XXXXXXXX", hint: "Enter the phone number that will receive M-Pesa." },
  { id: "PayPal", label: "PayPal", placeholder: "PayPal email", hint: "We'll send the payout to this PayPal email." },
  { id: "Bank", label: "Bank transfer", placeholder: "Account name, number & bank", hint: "Include account name, number and bank." },
  { id: "Airtel Money", label: "Airtel Money", placeholder: "Airtel phone number", hint: "Enter your Airtel Money number." },
];

function Wallet() {
  const qc = useQueryClient();
  const [method, setMethod] = useState("M-Pesa");
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("20");
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").single();
      return data;
    },
  });
  const { data: withdrawals } = useQuery({
    queryKey: ["withdrawals"],
    queryFn: async () => {
      const { data } = await supabase
        .from("withdrawals")
        .select("*")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const balance = Number(profile?.balance ?? 0);
  const earned = Number(profile?.earned ?? 0);
  const canWithdraw = balance >= 20;
  const shortfall = Math.max(0, 20 - balance);
  const active = METHODS.find((m) => m.id === method)!;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setOk(false);
    const a = parseFloat(amount);
    if (!a || a <= 0) return setErr("Enter a valid amount.");
    if (a < 20) return setErr("Minimum withdrawal is $20.00.");
    if (!destination.trim()) return setErr("Enter your payout destination.");
    if (method === "M-Pesa" || method === "Airtel Money") {
      const digits = destination.replace(/\D/g, "");
      if (!/^(?:254|0)?[71]\d{8}$/.test(digits))
        return setErr("Enter a valid Kenyan phone number (e.g. 07XXXXXXXX).");
    }
    if (method === "PayPal" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destination.trim()))
      return setErr("Enter a valid PayPal email address.");
    if (method === "Bank" && destination.trim().length < 10)
      return setErr("Include account name, number and bank (min 10 characters).");
    if (a > balance)
      return setErr(`Insufficient balance. You have $${balance.toFixed(2)}; you need $${(a - balance).toFixed(2)} more.`);

    const { data: u } = await supabase.auth.getUser();
    const uid = u.user?.id!;
    const { error } = await supabase.from("withdrawals").insert({
      user_id: uid,
      amount: a,
      method,
      destination,
    });
    if (error) return setErr(error.message);
    await supabase.from("profiles").update({ balance: balance - a }).eq("id", uid);
    setOk(true);
    setAmount("20");
    setDestination("");
    qc.invalidateQueries();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Wallet</h1>
        <p className="text-muted-foreground text-sm">
          Rewards land instantly. Withdraw when you reach $20.00.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div
          className="rounded-2xl p-6 shadow-md"
          style={{ background: "var(--brand)", color: "var(--brand-foreground)" }}
        >
          <div className="text-xs uppercase tracking-wider opacity-80">Available balance</div>
          <div className="text-5xl font-bold my-1">${balance.toFixed(2)}</div>
          <div className="text-sm opacity-80">Minimum withdrawal: $20.00</div>
        </div>
        <div
          className="rounded-2xl p-6 border"
          style={{ background: "var(--card)" }}
        >
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Total earned
          </div>
          <div className="text-5xl font-bold my-1">${earned.toFixed(2)}</div>
          <div className="text-sm text-muted-foreground">All-time review rewards</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <form
          onSubmit={submit}
          className="rounded-2xl border p-6 space-y-4"
          style={{ background: "var(--card)" }}
        >
          <div>
            <h2 className="font-bold text-2xl">Request withdrawal</h2>
            <p className="text-sm text-muted-foreground">
              Minimum $20.00. Funds arrive within <span className="font-semibold">24–48 hours</span> after approval.
            </p>
          </div>

          <label className="block">
            <span className="text-sm font-semibold block mb-1.5">Amount (USD)</span>
            <input
              type="number"
              step="0.01"
              min="20"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full h-11 px-3 rounded-lg border bg-transparent text-sm"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold block mb-1.5">Payment method</span>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full h-11 px-3 rounded-lg border bg-transparent text-sm"
            >
              {METHODS.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-semibold block mb-1.5">
              {method === "M-Pesa" ? "M-Pesa phone number" : method === "PayPal" ? "PayPal email" : method === "Bank" ? "Bank account details" : "Airtel phone number"}
            </span>
            <input
              placeholder={active.placeholder}
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full h-11 px-3 rounded-lg border bg-transparent text-sm"
            />
            <span className="text-xs text-muted-foreground block mt-1">{active.hint}</span>
          </label>

          {err && <p className="text-sm text-destructive">{err}</p>}
          {ok && <p className="text-sm" style={{ color: "var(--brand)" }}>Withdrawal request submitted.</p>}

          <button
            className="w-full h-12 rounded-full font-semibold shadow"
            style={{
              background: "var(--brand)",
              color: "var(--brand-foreground)",
            }}
          >
            {canWithdraw ? "Request withdrawal" : `Request withdrawal (need $${shortfall.toFixed(2)} more)`}
          </button>
        </form>

        <div
          className="rounded-2xl border p-6"
          style={{ background: "var(--card)" }}
        >
          <h2 className="font-bold text-2xl mb-3">Recent transactions</h2>
          {(!withdrawals || withdrawals.length === 0) ? (
            <p className="text-sm text-muted-foreground">No transactions yet.</p>
          ) : (
            <div className="space-y-2">
              {withdrawals.map((w) => (
                <div
                  key={w.id}
                  className="rounded-xl border p-3 flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <div className="font-semibold">${Number(w.amount).toFixed(2)} · {w.method}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {w.destination} · {new Date(w.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <span
                    className="text-xs font-bold px-2 py-1 rounded-full shrink-0"
                    style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
                  >
                    {w.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
