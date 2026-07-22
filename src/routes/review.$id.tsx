import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AuthGate } from "@/components/AuthGate";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export const Route = createFileRoute("/review/$id")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Write a review — ReviewSasa" },
      { name: "description", content: "Share an honest review and get paid instantly." },
    ],
  }),
  component: () => (
    <AuthGate>
      <ReviewForm />
    </AuthGate>
  ),
});

function ReviewForm() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<number | null>(null);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("reviews_active")
        .single();
      return data;
    },
  });

  const { data: company } = useQuery({
    queryKey: ["company", id],
    queryFn: async () => {
      const { data } = await supabase.from("companies").select("*").eq("id", id).single();
      return data;
    },
  });


  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (text.trim().length < 30) return setErr("Review must be at least 30 characters.");
    if (!company) return;
    setSubmitting(true);
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes.user?.id;
    if (!uid) { setSubmitting(false); return; }

    const reward = Number(company.payout);
    const { error: revErr } = await supabase.from("reviews").insert({
      user_id: uid,
      company_id: company.id,
      rating,
      text,
      reward,
    });
    if (revErr) { setErr(revErr.message); setSubmitting(false); return; }

    const { data: prof } = await supabase.from("profiles").select("balance, earned").eq("id", uid).single();
    const newBal = Number(prof?.balance ?? 0) + reward;
    const newEarned = Number(prof?.earned ?? 0) + reward;
    await supabase.from("profiles").update({ balance: newBal, earned: newEarned }).eq("id", uid);

    setDone(reward);
    setSubmitting(false);
    qc.invalidateQueries();
  };

  if (!company || profileLoading) return <div className="text-muted-foreground">Loading...</div>;

  if (!profile?.reviews_active) {
    navigate({ to: "/dashboard", search: { activate: 1 } as any, replace: true });
    return <div className="text-muted-foreground">Redirecting to activation…</div>;
  }



  if (done !== null) {
    return (
      <div className="max-w-md mx-auto text-center py-10">
        <div className="text-6xl mb-3">🎉</div>
        <h1 className="text-2xl font-bold">Review submitted</h1>
        <p className="text-muted-foreground mb-4">
          <span className="font-bold" style={{ color: "var(--brand)" }}>
            +${done.toFixed(2)}
          </span>{" "}
          added to your wallet.
        </p>
        <button
          onClick={() => navigate({ to: "/dashboard" })}
          className="px-5 py-2 rounded-full font-semibold"
          style={{ background: "var(--brand)", color: "var(--brand-foreground)" }}
        >
          Back to dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl"
          style={{ background: company.color + "22" }}
        >
          {company.emoji}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{company.name}</h1>
          <div className="text-sm text-muted-foreground">
            {company.location} · {company.industry}
          </div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-xs uppercase text-muted-foreground">Reward</div>
          <div className="text-xl font-bold" style={{ color: "var(--brand)" }}>
            ${Number(company.payout).toFixed(2)}
          </div>
        </div>
      </div>

      <form onSubmit={submit} className="rounded-2xl border p-5 space-y-4" style={{ background: "var(--card)" }}>
        <div>
          <label className="text-sm font-semibold block mb-2">Your rating</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                type="button"
                key={n}
                onClick={() => setRating(n)}
                className="text-3xl transition"
                style={{ color: n <= rating ? "var(--brand-accent)" : "var(--muted-foreground)" }}
              >
                ★
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-semibold block mb-2">
            Your review <span className="text-muted-foreground font-normal">(min 30 chars)</span>
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            className="w-full p-3 rounded-lg border bg-transparent text-sm"
            placeholder="Share your honest experience..."
          />
          <div className="text-xs text-muted-foreground mt-1">{text.length} / 30</div>
        </div>
        {err && <p className="text-sm text-destructive">{err}</p>}
        <button
          disabled={submitting}
          className="w-full h-11 rounded-full font-semibold shadow disabled:opacity-60"
          style={{ background: "var(--brand)", color: "var(--brand-foreground)" }}
        >
          {submitting ? "Submitting..." : `Submit and earn $${Number(company.payout).toFixed(2)}`}
        </button>
      </form>
    </div>
  );
}
