import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeCodeForTokens, fetchUserEmail } from "@/lib/gmail/oauth";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`${origin}/settings?gmail_error=${encodeURIComponent(error)}`);
  }

  const cookieState = request.cookies.get("gmail_oauth_state")?.value;
  if (!code || !state || !cookieState || state !== cookieState) {
    return NextResponse.redirect(`${origin}/settings?gmail_error=invalid_state`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login`);

  try {
    const tokens = await exchangeCodeForTokens(code);
    if (!tokens.refresh_token) {
      // Happens if user previously granted — force re-consent by re-running /connect.
      return NextResponse.redirect(
        `${origin}/settings?gmail_error=${encodeURIComponent(
          "no_refresh_token"
        )}`
      );
    }

    const email = await fetchUserEmail(tokens.access_token);

    const { error: upErr } = await supabase
      .from("profiles")
      .update({
        gmail_refresh_token: tokens.refresh_token,
        gmail_email: email,
        gmail_connected_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (upErr) throw upErr;
  } catch (e) {
    console.error("[gmail/callback]", e);
    return NextResponse.redirect(
      `${origin}/settings?gmail_error=${encodeURIComponent(
        e instanceof Error ? e.message : "unknown"
      )}`
    );
  }

  const res = NextResponse.redirect(`${origin}/settings?gmail_ok=1`);
  res.cookies.delete("gmail_oauth_state");
  return res;
}
