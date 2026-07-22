import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/lipwa-callback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json().catch(() => null);
        if (!body || typeof body !== "object") {
          return new Response("Invalid payload", { status: 400 });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const status = body.status as string;
        const checkout_id = body.checkout_id as string | undefined;
        const mpesa_code = (body.mpesa_code as string | null) ?? null;
        if (!checkout_id) return new Response("Missing checkout_id", { status: 400 });

        const { data: payment } = await supabaseAdmin
          .from("payments")
          .select("id, user_id, purpose")
          .eq("checkout_id", checkout_id)
          .maybeSingle();

        if (!payment) return new Response("ok"); // unknown ref, ack

        await supabaseAdmin
          .from("payments")
          .update({
            status,
            mpesa_code,
            raw: body,
            updated_at: new Date().toISOString(),
          })
          .eq("id", payment.id);

        if (status === "payment.success" && payment.purpose === "activation") {
          await supabaseAdmin
            .from("profiles")
            .update({ reviews_active: true })
            .eq("id", payment.user_id);
        }

        return Response.json({ received: true });
      },
      GET: async () => new Response("ok"),
    },
  },
});
