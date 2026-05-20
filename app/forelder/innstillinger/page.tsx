"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, isSupabaseConfigured, getCurrentHouseholdId } from "@/lib/supabase";
import { useSession } from "@/lib/useSession";
import { logout } from "@/lib/auth";
import SetupNotice from "@/components/SetupNotice";
import type { Household, HouseholdInvite, HouseholdMember } from "@/lib/types";

type MemberRow = HouseholdMember & { user_email?: string };

export default function SettingsPage() {
  const router = useRouter();
  const { session } = useSession();
  const [household, setHousehold] = useState<Household | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [invites, setInvites] = useState<HouseholdInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const hid = await getCurrentHouseholdId();
    setHouseholdId(hid);
    if (!hid) {
      setLoading(false);
      return;
    }
    const [hRes, mRes, iRes] = await Promise.all([
      supabase.from("households").select("*").eq("id", hid).single(),
      supabase.from("household_members").select("*").eq("household_id", hid),
      supabase
        .from("household_invites")
        .select("*")
        .eq("household_id", hid)
        .is("accepted_at", null)
        .order("created_at", { ascending: false }),
    ]);
    setHousehold((hRes.data as Household) ?? null);
    setMembers((mRes.data as MemberRow[]) ?? []);
    setInvites((iRes.data as HouseholdInvite[]) ?? []);
    setTempName(hRes.data?.name ?? "");
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    reload();
  }, [reload]);

  const saveName = async () => {
    if (!household || !tempName.trim()) return;
    await supabase.from("households").update({ name: tempName.trim() }).eq("id", household.id);
    setEditingName(false);
    reload();
  };

  const sendInvite = async () => {
    if (!household || !inviteEmail.trim() || !session) return;
    setInviteBusy(true);
    setInviteLink(null);
    const token = crypto.randomUUID().replace(/-/g, "");
    const { error } = await supabase.from("household_invites").insert({
      household_id: household.id,
      invited_by: session.user.id,
      invited_email: inviteEmail.trim().toLowerCase(),
      token,
      role: "co_parent",
    });
    setInviteBusy(false);
    if (!error) {
      const link = `${window.location.origin}/invite/${token}`;
      setInviteLink(link);
      setInviteEmail("");
      reload();
    }
  };

  const revokeInvite = async (id: string) => {
    if (!confirm("Trekk tilbake invitasjonen?")) return;
    await supabase.from("household_invites").delete().eq("id", id);
    reload();
  };

  const removeMember = async (m: MemberRow) => {
    if (m.user_id === session?.user.id) {
      alert("Du kan ikke fjerne deg selv.");
      return;
    }
    if (!confirm(`Fjern ${m.display_name ?? "co-parent"} fra husholdningen?`)) return;
    await supabase.from("household_members").delete().eq("id", m.id);
    reload();
  };

  const handleLogout = async () => {
    await logout();
    router.push("/auth/signin");
  };

  if (!isSupabaseConfigured) return <SetupNotice />;
  if (loading || !household) {
    return <div className="text-center py-12 text-4xl animate-float">⚙️</div>;
  }

  const myMembership = members.find((m) => m.user_id === session?.user.id);
  const isOwner = myMembership?.role === "owner";

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-3xl font-extrabold text-purple-900">Innstillinger</h1>
        <p className="text-purple-600 font-medium text-sm">Husholdning, medlemmer og abonnement</p>
      </header>

      {/* Husholdning */}
      <section>
        <h2 className="text-lg font-extrabold text-purple-900 mb-2">🏠 Husholdning</h2>
        <div className="card p-4">
          {editingName ? (
            <div className="flex gap-2">
              <input
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border-2 border-purple-200 outline-none"
              />
              <button onClick={saveName} className="btn-primary">
                Lagre
              </button>
              <button onClick={() => setEditingName(false)} className="btn-ghost">
                Avbryt
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-purple-500 uppercase">Navn</div>
                <div className="text-xl font-extrabold text-purple-900">{household.name}</div>
              </div>
              {isOwner && (
                <button onClick={() => setEditingName(true)} className="text-purple-500 px-2">
                  ✏️
                </button>
              )}
            </div>
          )}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs font-bold text-purple-500 uppercase">Abonnement:</span>
            <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-full uppercase">
              {household.plan === "beta" ? "Beta (gratis)" : household.plan}
            </span>
          </div>
        </div>
      </section>

      {/* Medlemmer */}
      <section>
        <h2 className="text-lg font-extrabold text-purple-900 mb-2">👥 Medlemmer</h2>
        <div className="grid gap-2">
          {members.map((m) => (
            <div key={m.id} className="card p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-xl">
                {m.role === "owner" ? "👑" : "👤"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-purple-900">
                  {m.display_name ?? "Medlem"}
                  {m.user_id === session?.user.id && (
                    <span className="text-xs font-medium text-purple-500"> (deg)</span>
                  )}
                </div>
                <div className="text-xs text-purple-500 font-medium">
                  {m.role === "owner" ? "Eier" : "Co-parent"}
                </div>
              </div>
              {isOwner && m.user_id !== session?.user.id && (
                <button onClick={() => removeMember(m)} className="text-red-400 px-2">
                  🗑️
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Invitasjoner */}
      {isOwner && (
        <section>
          <h2 className="text-lg font-extrabold text-purple-900 mb-2">✉️ Inviter co-parent</h2>
          <div className="card p-4">
            <p className="text-sm text-purple-700 mb-3">
              Inviter en annen voksen (f.eks. samværsforelder) til samme husholdning. De får tilgang til
              de samme barna, oppgavene og saldoene.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="epost@eksempel.no"
                className="flex-1 px-3 py-2 rounded-xl border-2 border-purple-200 outline-none"
              />
              <button
                onClick={sendInvite}
                disabled={inviteBusy || !inviteEmail.trim()}
                className="btn-primary disabled:opacity-50"
              >
                Inviter
              </button>
            </div>
            {inviteLink && (
              <div className="mt-3 bg-green-50 p-3 rounded-xl">
                <div className="text-xs font-bold text-green-700 mb-1">
                  ✓ Invitasjon laget — send denne lenken:
                </div>
                <input
                  readOnly
                  value={inviteLink}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="w-full text-xs bg-white p-2 rounded font-mono"
                />
              </div>
            )}
          </div>

          {invites.length > 0 && (
            <div className="mt-3 space-y-2">
              <div className="text-xs font-bold text-purple-500 uppercase">Pågående invitasjoner</div>
              {invites.map((i) => (
                <div key={i.id} className="card p-3 flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-purple-900 truncate">{i.invited_email}</div>
                    <div className="text-xs text-purple-500">
                      Utløper {new Date(i.expires_at).toLocaleDateString("nb-NO")}
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(`${window.location.origin}/invite/${i.token}`)
                    }
                    className="text-xs font-bold bg-purple-100 text-purple-700 px-2 py-1 rounded-full"
                  >
                    Kopier lenke
                  </button>
                  <button onClick={() => revokeInvite(i.id)} className="text-red-400 px-1">
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Konto */}
      <section>
        <h2 className="text-lg font-extrabold text-purple-900 mb-2">🔐 Konto</h2>
        <div className="card p-4 space-y-2">
          <div className="text-sm">
            <div className="text-xs font-bold text-purple-500 uppercase">E-post</div>
            <div className="font-bold text-purple-900">{session?.user.email}</div>
          </div>
          <button onClick={handleLogout} className="btn-ghost w-full mt-3">
            ← Logg ut
          </button>
        </div>
      </section>

      <p className="text-xs text-center text-purple-400 pt-4">Ukeslønn v3 · beta</p>
    </div>
  );
}
