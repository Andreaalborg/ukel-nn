import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Verifiser at request har gyldig forelder-profil-sesjon via assert_parent_session RPC.
 * Brukes av sensitive API-ruter (stripe, account delete).
 */
export async function assertParentSessionFromRequest(
  request: Request,
  supabaseUrl: string,
  serviceKey: string,
  accessToken: string
): Promise<{ ok: true; session: Record<string, unknown> } | { ok: false; status: number; error: string }> {
  const profileToken =
    request.headers.get("x-profile-session") ??
    request.headers.get("X-Profile-Session");

  if (!profileToken) {
    return { ok: false, status: 403, error: "Mangler forelder-sesjon (X-Profile-Session)" };
  }

  const userClient: SupabaseClient = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const { data, error } = await userClient.rpc("assert_parent_session", {
    p_token: profileToken,
  });

  if (error || !data) {
    return {
      ok: false,
      status: 403,
      error: error?.message ?? "Krever ulåst forelder-profil",
    };
  }

  return { ok: true, session: data as Record<string, unknown> };
}
