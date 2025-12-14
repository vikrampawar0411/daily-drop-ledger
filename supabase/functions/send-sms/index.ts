// Supabase Edge Function: send-sms
// Sends SMS using configurable provider (Textlocal or MSG91)
// Expects JSON: { to: "+919876543210", body: "https://example.com/connect?code=..." }

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

type SmsRequest = { to?: string; body?: string };

function jsonResponse(status: number, data: unknown) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function sanitizeNumber(input: string): string {
  return input.replace(/[^+\d]/g, "");
}

serve(async (req) => {
  if (req.method !== "POST") {
    return jsonResponse(405, { error: "Method Not Allowed" });
  }

  const auth = req.headers.get("Authorization") || "";
  // Optional: check a bearer token if desired
    // Use custom header to avoid Supabase JWT enforcement on Authorization
    const apiKeyHeader = req.headers.get("x-api-key") || req.headers.get("X-API-Key");
    const bearer = apiKeyHeader?.trim();
    if (!bearer || bearer !== Deno.env.get("SMS_BEARER_TOKEN")) {
      return jsonResponse(401, { code: 401, message: "Missing or invalid API key" });
  }

  let payload: SmsRequest;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse(400, { error: "Invalid JSON" });
  }

  const to = sanitizeNumber(payload.to || "");
  const body = payload.body?.toString() || "";
  if (!to || !body) {
    return jsonResponse(400, { error: "Missing 'to' or 'body'" });
  }

  // Provider selection: TEXTLOCAL or MSG91
  const PROVIDER = (Deno.env.get("SMS_PROVIDER") || "TEXTLOCAL").toUpperCase();

  if (PROVIDER === "TEXTLOCAL") {
    const TEXTLOCAL_API_KEY = Deno.env.get("TEXTLOCAL_API_KEY");
    const TEXTLOCAL_SENDER = Deno.env.get("TEXTLOCAL_SENDER") || "TXTLCL"; // must be 6 chars

    if (!TEXTLOCAL_API_KEY) {
      return jsonResponse(500, { error: "Textlocal env not configured" });
    }

    const tlUrl = "https://api.textlocal.in/send/";
    const tlBody = new URLSearchParams({
      apikey: TEXTLOCAL_API_KEY,
      numbers: to,
      sender: TEXTLOCAL_SENDER,
      message: body,
    });

    const tlResp = await fetch(tlUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tlBody.toString(),
    });

    const tlJson = await tlResp.json().catch(async () => ({ status: "error", errors: [{ message: await tlResp.text() }] }));
    if (!tlResp.ok || tlJson.status !== "success") {
      return jsonResponse(502, { error: "Textlocal error", details: tlJson });
    }
    return jsonResponse(200, { ok: true, provider: "TEXTLOCAL", details: tlJson });
  }

  if (PROVIDER === "MSG91") {
    const MSG91_AUTH_KEY = Deno.env.get("MSG91_AUTH_KEY");
    const MSG91_SENDER_ID = Deno.env.get("MSG91_SENDER_ID");
    const MSG91_TEMPLATE_ID = Deno.env.get("MSG91_TEMPLATE_ID"); // DLT template id (recommended in India)

    if (!MSG91_AUTH_KEY || !MSG91_SENDER_ID) {
      return jsonResponse(500, { error: "MSG91 env not configured" });
    }

    // MSG91 v5 flow API (India routes may require DLT registration)
    const msgUrl = "https://api.msg91.com/api/v5/flow";
    const payload = {
      sender: MSG91_SENDER_ID,
      short_url: "true",
      recipients: [
        {
          mobiles: to,
          // If you have a template like: "Click: {{link}}"
          // Use template variables to pass the link
          link: body,
        },
      ],
      ...(MSG91_TEMPLATE_ID ? { template_id: MSG91_TEMPLATE_ID } : {}),
    };

    const msgResp = await fetch(msgUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authkey: MSG91_AUTH_KEY,
      },
      body: JSON.stringify(payload),
    });

    const msgJson = await msgResp.json().catch(async () => ({ error: await msgResp.text() }));
    if (!msgResp.ok) {
      return jsonResponse(502, { error: "MSG91 error", details: msgJson });
    }
    return jsonResponse(200, { ok: true, provider: "MSG91", details: msgJson });
  }

  return jsonResponse(500, { error: "Unknown SMS_PROVIDER. Use TEXTLOCAL or MSG91" });
});
