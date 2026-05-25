"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase, isSupabaseConfigured, getCurrentHouseholdId } from "@/lib/supabase";
import { useSession } from "@/lib/useSession";
import { logout, clearActiveProfile } from "@/lib/auth";
import { clearCurrentHouseholdId } from "@/lib/supabase";
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
  const [exporting, setExporting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const hid = await getCurrentHouseholdId();
    setHouseholdId(hid);
    if (!hid) {
      setLoading(false);
      return;
    }
    const [hRes, mRes, iRes] = await Promise.all([
      supabase.from("households").select("*").eq("id", hid).single(),
      supabase.rpc("get_household_members", { p_household_id: hid }),
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
    await supabase.rpc("remove_household_member", { p_member_id: m.id });
    reload();
  };

  const handleLogout = async () => {
    await logout();
    router.push("/auth/signin");
  };

  const handleExport = async () => {
    setExporting(true);
    const { data, error } = await supabase.rpc("export_my_household");
    setExporting(false);
    if (error) {
      alert("Eksport feilet: " + error.message);
      return;
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gjore-data-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDelete = async () => {
    if (deleteConfirmText !== "SLETT") return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();
      if (!currentSession) throw new Error("Ikke innlogget");

      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${currentSession.access_token}`,
          "Content-Type": "application/json",
        },
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Sletting feilet");

      // Rydd lokalstate og send til signin
      clearActiveProfile();
      clearCurrentHouseholdId();
      await supabase.auth.signOut();
      router.push("/auth/signin");
    } catch (e: unknown) {
      setDeleteError(e instanceof Error ? e.message : "Ukjent feil");
      setDeleting(false);
    }
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

      {/* GDPR — eksport og sletting */}
      <section>
        <h2 className="text-lg font-extrabold text-purple-900 mb-2">📋 Personvern</h2>
        <div className="card p-4 space-y-3">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="btn-ghost w-full disabled:opacity-50"
          >
            {exporting ? "Eksporterer..." : "📥 Last ned mine data (JSON)"}
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full py-2 rounded-full bg-red-50 text-red-700 font-bold hover:bg-red-100 border-2 border-red-200"
          >
            🗑️ Slett konto og all data
          </button>
          <div className="text-[11px] text-purple-500 leading-relaxed pt-2">
            Du kan når som helst eksportere eller slette dataen din.{" "}
            <Link href="/personvern" className="underline">
              Personvernerklæring
            </Link>{" "}
            ·{" "}
            <Link href="/vilkar" className="underline">
              Vilkår
            </Link>
          </div>
        </div>
      </section>

      <p className="text-xs text-center text-purple-400 pt-4">Gjøre · beta</p>

      {/* Slett-bekreftelse modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-4">
              <div className="text-5xl mb-2">⚠️</div>
              <h2 className="text-xl font-extrabold text-purple-900">Slette konto?</h2>
              <p className="text-sm text-purple-700 mt-2">
                Dette sletter <strong>permanent</strong>:
              </p>
              <ul className="text-sm text-purple-700 text-left list-disc pl-6 mt-2">
                <li>Husholdningen, barn-profiler og PIN</li>
                <li>Alle oppgaver, fullføringer og saldoer</li>
                <li>Bonuser, perioder og strekk-historikk</li>
                <li>Din innlogging og e-postkonto i appen</li>
              </ul>
              <p className="text-sm text-red-600 font-bold mt-3">
                Handlingen kan ikke angres!
              </p>
            </div>
            <label className="block text-sm font-bold text-purple-700 mb-1">
              Skriv <span className="font-mono">SLETT</span> for å bekrefte
            </label>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border-2 border-red-200 outline-none mb-3 font-mono"
            />
            {deleteError && (
              <div className="bg-red-50 text-red-700 text-sm font-semibold p-2 rounded-xl mb-2">
                {deleteError}
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-ghost flex-1"
              >
                Avbryt
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteConfirmText !== "SLETT" || deleting}
                className="flex-1 py-2 rounded-full bg-red-600 text-white font-bold disabled:opacity-50"
              >
                {deleting ? "Sletter..." : "Slett alt"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
