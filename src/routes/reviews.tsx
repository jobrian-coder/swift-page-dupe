import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthGate } from "@/components/AuthGate";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/reviews")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "My Reviews — RatePay" },
      { name: "description", content: "Every review you've submitted and its reward." },
      { property: "og:title", content: "My Reviews — RatePay" },
      { property: "og:description", content: "Every review you've submitted and its reward." },
    ],
  }),
  component: () => (
    <AuthGate>
      <Reviews />
    </AuthGate>
  ),
});

function Reviews() {
  const { data } = useQuery({
    queryKey: ["my-reviews"],
    queryFn: async () => {
      const { data } = await supabase
        .from("reviews")
        .select("*, companies(name, emoji, color)")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">My Reviews</h1>
      {(!data || data.length === 0) && (
        <div className="rounded-2xl border p-8 text-center" style={{ background: "var(--card)" }}>
          <p className="text-muted-foreground mb-3">You haven't reviewed anything yet.</p>
          <Link
            to="/companies"
            className="inline-block px-5 py-2 rounded-full font-semibold"
            style={{ background: "var(--brand)", color: "var(--brand-foreground)" }}
          >
            Start reviewing
          </Link>
        </div>
      )}
      <div className="space-y-3">
        {(data ?? []).map((r: any) => (
          <div
            key={r.id}
            className="rounded-2xl border p-4 flex items-start gap-3"
            style={{ background: "var(--card)" }}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
              style={{ background: (r.companies?.color ?? "#0f766e") + "22" }}
            >
              {r.companies?.emoji}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <div className="font-bold">{r.companies?.name}</div>
                <div className="font-bold" style={{ color: "var(--brand)" }}>
                  +${Number(r.reward).toFixed(2)}
                </div>
              </div>
              <div className="text-sm">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
              <div className="text-sm text-muted-foreground mt-1">{r.text}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {new Date(r.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
