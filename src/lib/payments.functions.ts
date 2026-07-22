import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (/^07\d{8}$/.test(digits) || /^01\d{8}$/.test(digits)) return "254" + digits.slice(1);
  if (/^2547\d{8}$/.test(digits) || /^2541\d{8}$/.test(digits)) return digits;
  if (/^7\d{8}$/.test(digits) || /^1\d{8}$/.test(digits)) return "254" + digits;
  return null;
}

export const initiateActivationPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { phone: string }) => input)
  .handler(async ({ data, context }) => {
    const apiKey = process.env.LIPWA_API_KEY;
    const channelId = process.env.LIPWA_CHANNEL_ID;
    if (!apiKey || !channelId) throw new Error("Payments not configured");

    const phone = normalizePhone(data.phone);
    if (!phone) throw new Error("Invalid M-Pesa phone number");

    const amount = 1; // Lipwa minimum is 10 KES; using integer amount required by API
    const origin = process.env.PUBLIC_APP_URL || "https://project--501c8904-9226-4be3-8ab6-e42f166c2e86.lovable.app";
    const callback_url = `${origin}/api/public/lipwa-callback`;

    const res = await fetch("https://pay.lipwa.app/api/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        phone_number: phone,
        channel_id: channelId,
        callback_url,
        api_ref: { user_id: context.userId, purpose: "activation" },
      }),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok || body?.ResponseCode !== "0") {
      console.error("Lipwa STK error", res.status, body);
      throw new Error(body?.ResponseDescription || body?.errorMessage || "Failed to send STK push");
    }

    const checkout_id = body.CheckoutRequestID as string;
    const merchant_request_id = body.MerchantRequestID as string;

    await context.supabase.from("payments").insert({
      user_id: context.userId,
      checkout_id,
      merchant_request_id,
      amount,
      phone,
      purpose: "activation",
      status: "queued",
      raw: body,
    });

    return { checkout_id, message: body.CustomerMessage as string };
  });

export const getPaymentStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { checkout_id: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("payments")
      .select("status, mpesa_code")
      .eq("checkout_id", data.checkout_id)
      .maybeSingle();
    return row ?? { status: "queued", mpesa_code: null };
  });
