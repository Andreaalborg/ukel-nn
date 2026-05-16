"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Profile, Recurrence, Task } from "@/lib/types";
import { formatKr, kronerToOre } from "@/lib/utils";
import { ColorPicker, EmojiPicker } from "@/components/EmojiPicker";
import SetupNotice from "@/components/SetupNotice";
import { AnimatePresence, motion } from "framer-motion";

type Draft = {
  id?: string;
  title: string;
  description: string;
  reward_kr: number;
  icon: string;
  color: string;
  recurrence: Recurrence;
  assigned_to: string | null;
  active: boolean;
};

const EMPTY: Draft = {
  title: "",
  description: "",
  reward_kr: 10,
  icon: "⭐",
  color: "#FFD93D",
  recurrence: "daily",
  assigned_to: null,
  active: true,
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [kids, setKids] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Draft | null>(null);

  const reload = useCallback(async () => {
    const [tRes, kRes] = await Promise.all([
      supabase.from("tasks").select("*").order("sort_order"),
      supabase.from("profiles").select("*").eq("role", "child").order("sort_order"),
    ]);
    setTasks((tRes.data as Task[]) ?? []);
    setKids((kRes.data as Profile[]) ?? []);
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
    if (!editing || !editing.title.trim()) return;
    const payload = {
      title: editing.title.trim(),
      description: editing.description.trim() || null,
      reward_ore: kronerToOre(editing.reward_kr),
      icon: editing.icon,
      color: editing.color,
      recurrence: editing.recurrence,
      assigned_to: editing.assigned_to,
      active: editing.active,
    };
    if (editing.id) {
      await supabase.from("tasks").update(payload).eq("id", editing.id);
    } else {
      await supabase
        .from("tasks")
        .insert({ ...payload, sort_order: tasks.length + 1 });
    }
    setEditing(null);
    reload();
  };

  const del = async (id: string) => {
    if (!confirm("Slett oppgaven? Eksisterende fullføringer blir også fjernet.")) return;
    await supabase.from("tasks").delete().eq("id", id);
    reload();
  };

  const toggleActive = async (t: Task) => {
    await supabase.from("tasks").update({ active: !t.active }).eq("id", t.id);
    reload();
  };

  if (!isSupabaseConfigured) return <SetupNotice />;
  if (loading) return <div className="text-center py-12 text-4xl animate-float">📝</div>;

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-purple-900">Oppgaver</h1>
          <p className="text-purple-600 font-medium text-sm">Lag, rediger og slett oppgaver</p>
        </div>
        <button onClick={() => setEditing({ ...EMPTY })} className="btn-primary">
          + Ny
        </button>
      </header>

      <div className="grid gap-2">
        <AnimatePresence>
          {tasks.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`card p-3 flex items-center gap-3 ${!t.active && "opacity-50"}`}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: `${t.color}33` }}
              >
                {t.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-extrabold text-purple-900 truncate">{t.title}</div>
                <div className="text-xs text-purple-500">
                  {formatKr(t.reward_ore)} ·{" "}
                  {t.recurrence === "daily" ? "Hver dag" : t.recurrence === "weekly" ? "Hver uke" : "Engangs"}
                  {t.assigned_to && ` · ${kids.find((k) => k.id === t.assigned_to)?.name ?? ""}`}
                </div>
              </div>
              <button
                onClick={() => toggleActive(t)}
                className={`text-xs font-bold px-2 py-1 rounded-full ${
                  t.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                }`}
              >
                {t.active ? "PÅ" : "AV"}
              </button>
              <button
                onClick={() =>
                  setEditing({
                    id: t.id,
                    title: t.title,
                    description: t.description ?? "",
                    reward_kr: t.reward_ore / 100,
                    icon: t.icon,
                    color: t.color,
                    recurrence: t.recurrence,
                    assigned_to: t.assigned_to,
                    active: t.active,
                  })
                }
                className="text-purple-500 px-2"
              >
                ✏️
              </button>
              <button onClick={() => del(t.id)} className="text-red-400 px-2">
                🗑️
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        {tasks.length === 0 && (
          <div className="card p-6 text-center">
            <div className="text-4xl mb-1">📝</div>
            <p className="font-bold text-purple-900">Ingen oppgaver enda</p>
            <p className="text-sm text-purple-500">Trykk "+ Ny" for å lage den første!</p>
          </div>
        )}
      </div>

      {editing && (
        <TaskEditor
          draft={editing}
          kids={kids}
          onClose={() => setEditing(null)}
          onChange={setEditing}
          onSave={save}
        />
      )}
    </div>
  );
}

function TaskEditor({
  draft,
  kids,
  onClose,
  onChange,
  onSave,
}: {
  draft: Draft;
  kids: Profile[];
  onClose: () => void;
  onChange: (d: Draft) => void;
  onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6" onClick={onClose}>
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-extrabold text-purple-900">{draft.id ? "Rediger" : "Ny oppgave"}</h2>
          <button onClick={onClose} className="text-2xl text-purple-400">✕</button>
        </div>

        <label className="block text-sm font-bold text-purple-700 mb-1">Navn</label>
        <input
          type="text"
          value={draft.title}
          onChange={(e) => onChange({ ...draft, title: e.target.value })}
          placeholder="F.eks. Rydde rommet"
          className="w-full px-3 py-2 rounded-xl border-2 border-purple-200 focus:border-purple-500 outline-none mb-3"
        />

        <label className="block text-sm font-bold text-purple-700 mb-1">Beskrivelse (valgfritt)</label>
        <input
          type="text"
          value={draft.description}
          onChange={(e) => onChange({ ...draft, description: e.target.value })}
          className="w-full px-3 py-2 rounded-xl border-2 border-purple-200 focus:border-purple-500 outline-none mb-3"
        />

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-sm font-bold text-purple-700 mb-1">Belønning (kr)</label>
            <input
              type="number"
              min={0}
              step={0.5}
              value={draft.reward_kr}
              onChange={(e) => onChange({ ...draft, reward_kr: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-xl border-2 border-purple-200 focus:border-purple-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-purple-700 mb-1">Hyppighet</label>
            <select
              value={draft.recurrence}
              onChange={(e) => onChange({ ...draft, recurrence: e.target.value as Recurrence })}
              className="w-full px-3 py-2 rounded-xl border-2 border-purple-200 focus:border-purple-500 outline-none bg-white"
            >
              <option value="daily">Hver dag</option>
              <option value="weekly">Hver uke</option>
              <option value="once">Engangs</option>
            </select>
          </div>
        </div>

        <label className="block text-sm font-bold text-purple-700 mb-1">For hvem?</label>
        <select
          value={draft.assigned_to ?? ""}
          onChange={(e) => onChange({ ...draft, assigned_to: e.target.value || null })}
          className="w-full px-3 py-2 rounded-xl border-2 border-purple-200 focus:border-purple-500 outline-none bg-white mb-3"
        >
          <option value="">Alle barn</option>
          {kids.map((k) => (
            <option key={k.id} value={k.id}>
              {k.name}
            </option>
          ))}
        </select>

        <label className="block text-sm font-bold text-purple-700 mb-1">Ikon</label>
        <div className="mb-3">
          <EmojiPicker value={draft.icon} onChange={(v) => onChange({ ...draft, icon: v })} type="task" />
        </div>

        <label className="block text-sm font-bold text-purple-700 mb-2">Farge</label>
        <ColorPicker value={draft.color} onChange={(v) => onChange({ ...draft, color: v })} />

        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="btn-ghost flex-1">Avbryt</button>
          <button onClick={onSave} className="btn-primary flex-1">{draft.id ? "Lagre" : "Opprett"}</button>
        </div>
      </motion.div>
    </div>
  );
}
