const supabaseFunctionUrl = process.env.SUPABASE_FUNCTION_URL || (process.env.SUPABASE_URL
  ? `${process.env.SUPABASE_URL.replace(/\/$/, "")}/functions/v1/send-welcome-email`
  : null);

const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

async function sendWelcomeEmail(toEmail) {
  if (!toEmail) {
    console.error("Welcome email skipped: missing recipient email.");
    return;
  }

  if (!supabaseFunctionUrl || !supabaseAnonKey) {
    console.error("Welcome email skipped: missing SUPABASE_FUNCTION_URL or SUPABASE_ANON_KEY.");
    return;
  }

  try {
    const response = await fetch(supabaseFunctionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseAnonKey}`,
        apikey: supabaseAnonKey,
      },
      body: JSON.stringify({
        email: toEmail,
      }),
    });

    if (!response.ok) {
      const responseBody = await response.text();
      console.error("Error sending welcome email via Supabase Edge Function:", responseBody);
      return;
    }

    console.log("Welcome email sent via Supabase Edge Function!");
  } catch (error) {
    console.error("Error calling Supabase Edge Function:", error);
  }
}

module.exports = { sendWelcomeEmail };
