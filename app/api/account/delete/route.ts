import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Sletter alt:
 *  - Husholdningen (cascade fjerner alle relaterte tabeller)
 *  - Brukerens Supabase Auth-konto
 *
 * Krever at brukeren er innlogget (sender med Bearer-token i Authorization-header).
 * Krever at SUPABASE_SERVICE_ROLE_KEY er satt som server-side env-variabel (IKKE eksponert).
 */
export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { error: "Server-konfigurasjon mangler" },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Ikke autentisert" }, { status: 401 });
  }
  const accessToken = authHeader.slice("Bearer ".length);

  // Bruk en klient med service role for å verifisere brukeren og slette
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Hent brukeren basert på access token
  const { data: userData, error: userErr } = await admin.auth.getUser(accessToken);
  if (userErr || !userData.user) {
    return NextResponse.json({ error: "Ugyldig sesjon" }, { status: 401 });
  }
  const userId = userData.user.id;

  // 1) Slett husholdningen (vil cascade) via en bruker-skoped klient så RPC har auth.uid()
  const userClient = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
  const { error: rpcErr } = await userClient.rpc("delete_my_household");
  if (rpcErr && !rpcErr.message?.includes("Ingen husholdning")) {
    // Hvis brukeren ikke har en husholdning er det greit — vi fortsetter til auth-sletting
    return NextResponse.json({ error: rpcErr.message }, { status: 500 });
  }

  // 2) Slett auth-brukeren
  const { error: authDelErr } = await admin.auth.admin.deleteUser(userId);
  if (authDelErr) {
    return NextResponse.json({ error: authDelErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
