import { createFileRoute } from "@tanstack/react-router";
import { AuthGate } from "@/components/AuthGate";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export const Route = createFileRoute("/wallet")({
  head: () => ({
    meta: [
      { title: "Wallet — RatePay" },
      { name: "description", content: "Track your balance and withdraw once you hit $20." },
      { property: "og:title", content: "Wallet — RatePay" },
      { property: "og:description", content: "Track your balance and withdraw once you hit $20." },
    ],
  }),
  component: () => (
    <AuthGate>
      <Wallet />
    </AuthGate>
  ),
});

function Wallet() {
  const qc = useQueryClient();
  const [method, setMethod] = useState("PayPal");
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
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
  const canWithdraw = balance >= 20;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setOk(false);
    const a = parseFloat(amount);
    if (!a || a < 20) return setErr("Minimum withdrawal is $20.");
    if (a > balance) return setErr("Amount exceeds balance.");
    if (!destination.trim()) return setErr("Enter your payout destination.");
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
    setAmount("");
    setDestination("");
    qc.invalidateQueries();
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-3xl font-bold">Wallet</h1>

      <div
        className="rounded-2xl p-6 text-center shadow-md"
        style={{ background: "var(--brand)", color: "var(--brand-foreground)" }}
      >
        <div className="text-xs uppercase tracking-wider opacity-80">Available balance</div>
        <div className="text-5xl font-bold my-1">${balance.toFixed(2)}</div>
        <div className="text-sm opacity-80">
          Earned lifetime: ${Number(profile?.earned ?? 0).toFixed(2)}
        </div>
      </div>

      <form
        onSubmit={submit}
        className="rounded-2xl border p-5 space-y-3"
        style={{ background: "var(--card)" }}
      >
        <h2 className="font-bold text-lg">Withdraw</h2>
        {!canWithdraw && (
          <p className="text-sm text-muted-foreground">
            You need at least $20 to withdraw. Keep reviewing!
          </p>
        )}
        <div className="grid grid-cols-2 gap-2">
          {["PayPal", "Venmo", "Cash App", "Bank"].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethod(m)}
              className="h-10 rounded-lg border text-sm font-semibold"
              style={{
                background: method === m ? "var(--brand)" : "transparent",
                color: method === m ? "var(--brand-foreground)" : "var(--foreground)",
                borderColor: method === m ? "var(--brand)" : "var(--border)",
              }}
            >
              {m}
            </button>
          ))}
        </div>
        <input
          placeholder={
            method === "Bank"
              ? "Account details"
              : method === "PayPal"
                ? "PayPal email"
                : `${method} handle`
          }
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          className="w-full h-11 px-3 rounded-lg border bg-transparent text-sm"
          disabled={!canWithdraw}
        />
        <input
          type="number"
          step="0.01"
          min="20"
          placeholder="Amount (min $20)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full h-11 px-3 rounded-lg border bg-transparent text-sm"
          disabled={!canWithdraw}
        />
        {err && <p className="text-sm text-destructive">{err}</p>}
        {ok && <p className="text-sm" style={{ color: "var(--brand)" }}>Withdrawal request submitted.</p>}
        <button
          disabled={!canWithdraw}
          className="w-full h-11 rounded-full font-semibold shadow disabled:opacity-50"
          style={{ background: "var(--brand)", color: "var(--brand-foreground)" }}
        >
          Request withdrawal
        </button>
      </form>

      <div>
        <h2 className="font-bold text-lg mb-3">History</h2>
        {(!withdrawals || withdrawals.length === 0) && (
          <p className="text-sm text-muted-foreground">No withdrawals yet.</p>
        )}
        <div className="space-y-2">
          {(withdrawals ?? []).map((w) => (
            <div
              key={w.id}
              className="rounded-xl border p-3 flex items-center justify-between"
              style={{ background: "var(--card)" }}
            >
              <div>
                <div className="font-semibold">${Number(w.amount).toFixed(2)} · {w.method}</div>
                <div className="text-xs text-muted-foreground">
                  {w.destination} · {new Date(w.created_at).toLocaleDateString()}
                </div>
              </div>
              <span
                className="text-xs font-bold px-2 py-1 rounded-full"
                style={{
                  background: "var(--accent)",
                  color: "var(--accent-foreground)",
                }}
              >
                {w.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
