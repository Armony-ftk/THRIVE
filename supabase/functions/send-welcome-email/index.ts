// @ts-nocheck

/// <reference lib="deno.ns" />

declare const Deno: any;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type WelcomeEmailPayload = {
  email?: string;
  name?: string;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function buildMessage(name: string) {
  const displayName = name || "there";

  return {
    subject: "Your Thrive account is ready",
    text: `Hi ${displayName},

Your Thrive account has been created successfully.

You can now log in and start using the platform.

If you did not expect this email, you can safely ignore it.

Best regards,
Thrive`,
    html: `
      <html>
        <body style="margin:0;padding:0;background:#f3f5f8;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
          <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">Your Thrive account is ready.</div>
          <div style="max-width:680px;margin:0 auto;padding:42px 18px;">
            <div style="border-radius:24px;background:linear-gradient(180deg,#0f172a 0%,#111827 100%);padding:1px;box-shadow:0 18px 45px rgba(15,23,42,0.18);">
              <div style="border-radius:23px;background:#ffffff;overflow:hidden;">
                <div style="padding:28px 32px;background:linear-gradient(135deg,#0f172a 0%,#1f2937 100%);color:#ffffff;">
                  <div style="display:inline-block;padding:7px 14px;border-radius:999px;background:rgba(255,255,255,0.12);font-size:12px;letter-spacing:0.1em;text-transform:uppercase;">
                    Thrive
                  </div>
                  <h1 style="margin:18px 0 8px;font-size:32px;line-height:1.15;">Welcome aboard</h1>
                  <p style="margin:0;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.9);">Your account has been created and is ready to use.</p>
                </div>

                <div style="padding:32px;">
                  <p style="font-size:16px;line-height:1.8;margin:0 0 18px;">Hi ${displayName},</p>
                  <p style="font-size:16px;line-height:1.8;margin:0 0 18px;">We’re glad to have you with us. Your Thrive account is active, and you can now log in to get started.</p>
                  <div style="margin:28px 0;padding:18px 20px;border-radius:18px;background:#f8fafc;border:1px solid #e5e7eb;">
                    <p style="margin:0;font-size:15px;line-height:1.7;color:#374151;">If you did not create this account, you can safely ignore this message.</p>
                  </div>
                  <p style="font-size:15px;line-height:1.7;margin:0;color:#374151;">Best regards,<br><strong>Thrive</strong></p>
                </div>
              </div>
            </div>
            <p style="text-align:center;color:#6b7280;font-size:12px;line-height:1.6;margin:18px 0 0;">Sent by Thrive.</p>
          </div>
        </body>
      </html>
    `,
  };
}

Deno.serve(async (req: any) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const resendFromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "Thrive <noreply@thrive.co.za>";

  if (!resendApiKey) {
    return new Response(JSON.stringify({ error: "missing_resend_api_key" }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }

  let payload: WelcomeEmailPayload;

  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }

  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  const name = typeof payload.name === "string" ? payload.name.trim() : "";

  if (!email || !isValidEmail(email)) {
    return new Response(JSON.stringify({ error: "invalid_email" }), {
      status: 400,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }

  const { subject, text, html } = buildMessage(name);

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: resendFromEmail,
      to: [email],
      subject,
      text,
      html,
    }),
  });

  if (!resendResponse.ok) {
    const details = await resendResponse.text();
    return new Response(JSON.stringify({ error: "resend_failed", details }), {
      status: 502,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
});