"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured, getCurrentHouseholdId } from "@/lib/supabase";
import type { Profile, Role } from "@/lib/types";
import { ColorPicker, EmojiPicker } from "@/components/EmojiPicker";
import ProfileAvatar from "@/components/ProfileAvatar";
import SetupNotice from "@/components/SetupNotice";
import { AnimatePresence, motion } from "framer-motion";

type Draft = {
  id?: string;
  name: string;
  role: Role;
  pin: string;
  avatar_color: string;
  avatar_emoji: string;
  birthdate: string;
};

const EMPTY: Draft = {
  name: "",
  role: "child",
  pin: "1111",
  avatar_color: "#FFD93D",
  avatar_emoji: "🦁",
  birthdate: "",
};

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [householdId, setHouseholdId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const hid = await getCurrentHouseholdId();
    setHouseholdId(hid);
    const { data } = await supabase.from("profiles").select("*").order("sort_order");
    setProfiles((data as Profile[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    reload();
  }, [reload]);

  const save = async () => {
    if (!editing || !editing.name.trim() || !householdId) return;
    if (!/^\d{4,6}$/.test(editing.pin)) {
      alert("PIN må være 4-6 sifre");
      return;
    }
    const payload = {
      household_id: householdId,
      name: editing.name.trim(),
      role: editing.role,
      pin: editing.pin,
      avatar_color: editing.avatar_color,
      avatar_emoji: editing.avatar_emoji,
      birthdate: editing.birthdate || null,
    };
    if (editing.id) {
      await supabase.from("profiles").update(payload).eq("id", editing.id);
    } else {
      await supabase
        .from("profiles")
        .insert({ ...payload, sort_order: profiles.length });
    }
    setEditing(null);
    reload();
  };

  const del = async (id: string) => {
    if (!confirm("Slette profilen? Alle oppgaver og saldo blir borte!")) return;
    await supabase.from("profiles").delete().eq("id", id);
    reload();
  };

  if (!isSupabaseConfigured) return <SetupNotice />;
  if (loading) return <div className="text-center py-12 text-4xl animate-float">👥</div>;

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-purple-900">Profiler</h1>
          <p className="text-purple-600 font-medium text-sm">Familiemedlemmer, navn, PIN, avatar</p>
        </div>
        <button onClick={() => setEditing({ ...EMPTY })} className="btn-primary">
          + Ny
        </button>
      </header>

      <div className="grid gap-3">
        <AnimatePresence>
          {profiles.map((p) => (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="card p-4 flex items-center gap-3"
            >
              <ProfileAvatar emoji={p.avatar_emoji} color={p.avatar_color} size="md" />
              <div className="flex-1 min-w-0">
                <div className="font-extrabold text-purple-900 text-lg">{p.name}</div>
                <div className="text-sm text-purple-500">
                  {p.role === "parent" ? "👑 Voksen" : "🎮 Barn"} · PIN: <span className="font-mono">{p.pin}</span>
                </div>
              </div>
              <button
                onClick={() =>
                  setEditing({
                    id: p.id,
                    name: p.name,
                    role: p.role,
                    pin: p.pin,
                    avatar_color: p.avatar_color,
                    avatar_emoji: p.avatar_emoji,
                    birthdate: p.birthdate ?? "",
                  })
                }
                className="text-purple-500 px-2"
              >
                ✏️
              </button>
              {profiles.length > 1 && (
                <button onClick={() => del(p.id)} className="text-red-400 px-2">🗑️</button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6" onClick={() => setEditing(null)}>
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-extrabold text-purple-900">{editing.id ? "Rediger" : "Ny profil"}</h2>
              <button onClick={() => setEditing(null)} className="text-2xl text-purple-400">✕</button>
            </div>

            <div className="flex justify-center mb-4">
              <ProfileAvatar emoji={editing.avatar_emoji} color={editing.avatar_color} size="lg" />
            </div>

            <label className="block text-sm font-bold text-purple-700 mb-1">Navn</label>
            <input
              type="text"
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border-2 border-purple-200 focus:border-purple-500 outline-none mb-3"
            />

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-sm font-bold text-purple-700 mb-1">Rolle</label>
                <select
                  value={editing.role}
                  onChange={(e) => setEditing({ ...editing, role: e.target.value as Role })}
                  className="w-full px-3 py-2 rounded-xl border-2 border-purple-200 outline-none bg-white"
                >
                  <option value="child">Barn</option>
                  <option value="parent">Voksen</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-purple-700 mb-1">PIN (4-6 siffer)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={editing.pin}
                  onChange={(e) => setEditing({ ...editing, pin: e.target.value.replace(/\D/g, "") })}
                  className="w-full px-3 py-2 rounded-xl border-2 border-purple-200 outline-none font-mono"
                />
              </div>
            </div>

            <label className="block text-sm font-bold text-purple-700 mb-1">Fødselsdato (valgfritt)</label>
            <input
              type="date"
              value={editing.birthdate}
              onChange={(e) => setEditing({ ...editing, birthdate: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border-2 border-purple-200 outline-none mb-3"
            />

            <label className="block text-sm font-bold text-purple-700 mb-1">Avatar</label>
            <div className="mb-3">
              <EmojiPicker value={editing.avatar_emoji} onChange={(v) => setEditing({ ...editing, avatar_emoji: v })} type="profile" />
            </div>

            <label className="block text-sm font-bold text-purple-700 mb-2">Farge</label>
            <ColorPicker value={editing.avatar_color} onChange={(v) => setEditing({ ...editing, avatar_color: v })} />

            <div className="flex gap-2 mt-6">
              <button onClick={() => setEditing(null)} className="btn-ghost flex-1">Avbryt</button>
              <button onClick={save} className="btn-primary flex-1">{editing.id ? "Lagre" : "Opprett"}</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
