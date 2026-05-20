"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured, getCurrentHouseholdId } from "@/lib/supabase";
import type { Profile, Recurrence, Task } from "@/lib/types";
import { formatKr, kronerToOre } from "@/lib/utils";
import { describeRecurrence, DAY_NAMES } from "@/lib/scheduling";
import { ColorPicker, EmojiPicker } from "@/components/EmojiPicker";
import SetupNotice from "@/components/SetupNotice";
import { AnimatePresence, motion } from "framer-motion";

type Draft = {
  id?: string;
  title: string;
  description: string;
  reward_kr: number;
  xp_value: number;
  icon: string;
  color: string;
  recurrence: Recurrence;
  days_of_week: number[];
  interval_days: number;
  start_date: string;
  end_date: string;
  assigned_to: string | null;
  active: boolean;
};

const EMPTY: Draft = {
  title: "",
  description: "",
  reward_kr: 5,
  xp_value: 10,
  icon: "⭐",
  color: "#FFD93D",
  recurrence: "daily",
  days_of_week: [1, 2, 3, 4, 5],
  interval_days: 2,
  start_date: "",
  end_date: "",
  assigned_to: null,
  active: true,
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [kids, setKids] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const reload = useCallback(async () => {
    const hid = await getCurrentHouseholdId();
    setHouseholdId(hid);
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
    if (!editing || !editing.title.trim() || !householdId) return;
    const payload = {
      household_id: householdId,
      title: editing.title.trim(),
      description: editing.description.trim() || null,
      reward_ore: kronerToOre(editing.reward_kr),
      xp_value: Math.max(1, editing.xp_value),
      icon: editing.icon,
      color: editing.color,
      recurrence: editing.recurrence,
      days_of_week: editing.recurrence === "days_of_week" ? editing.days_of_week : null,
      interval_days: editing.recurrence === "interval" ? editing.interval_days : null,
      start_date: editing.start_date || null,
      end_date: editing.end_date || null,
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

  // Grupper oppgaver per barn (eller "alle")
  const groups: { key: string; label: string; emoji: string; color: string; tasks: Task[] }[] = [
    {
      key: "all",
      label: "Alle barn",
      emoji: "👨‍👩‍👧‍👦",
      color: "#8B5CF6",
      tasks: tasks.filter((t) => !t.assigned_to),
    },
    ...kids.map((k) => ({
      key: k.id,
      label: k.name,
      emoji: k.avatar_emoji,
      color: k.avatar_color,
      tasks: tasks.filter((t) => t.assigned_to === k.id),
    })),
  ];

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-purple-900">Oppgaver</h1>
          <p className="text-purple-600 font-medium text-sm">
            Gruppert per barn. Klikk for å åpne/lukke.
          </p>
        </div>
        <button onClick={() => setEditing({ ...EMPTY })} className="btn-primary">
          + Ny
        </button>
      </header>

      <div className="space-y-3">
        {groups.map((g) => {
          const isOpen = openGroups[g.key] ?? true;
          const active = g.tasks.filter((t) => t.active).length;
          return (
            <div key={g.key} className="card overflow-hidden">
              <button
                onClick={() => setOpenGroups({ ...openGroups, [g.key]: !isOpen })}
                className="w-full p-3 flex items-center gap-3 hover:bg-purple-50"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: `${g.color}33` }}
                >
                  {g.emoji}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-extrabold text-purple-900">{g.label}</div>
                  <div className="text-xs text-purple-500 font-medium">
                    {g.tasks.length} oppgaver · {active} aktive
                  </div>
                </div>
                <div className={`text-purple-400 transition-transform ${isOpen ? "rotate-90" : ""}`}>
                  →
                </div>
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="border-t border-purple-100"
                  >
                    {g.tasks.length === 0 ? (
                      <div className="p-4 text-center text-purple-400 text-sm">
                        Ingen oppgaver enda for {g.label.toLowerCase()}.
                      </div>
                    ) : (
                      <div className="divide-y divide-purple-50">
                        {g.tasks.map((t) => (
                          <div
                            key={t.id}
                            className={`p-3 flex items-center gap-3 ${!t.active && "opacity-50"}`}
                          >
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                              style={{ background: `${t.color}33` }}
                            >
                              {t.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-extrabold text-purple-900 truncate">
                                {t.title}
                              </div>
                              <div className="text-xs text-purple-500">
                                {formatKr(t.reward_ore)} · {t.xp_value} XP ·{" "}
                                {describeRecurrence(t)}
                              </div>
                            </div>
                            <button
                              onClick={() => toggleActive(t)}
                              className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                                t.active
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-500"
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
                                  xp_value: t.xp_value ?? 10,
                                  icon: t.icon,
                                  color: t.color,
                                  recurrence: t.recurrence,
                                  days_of_week: t.days_of_week ?? [1, 2, 3, 4, 5],
                                  interval_days: t.interval_days ?? 2,
                                  start_date: t.start_date ?? "",
                                  end_date: t.end_date ?? "",
                                  assigned_to: t.assigned_to,
                                  active: t.active,
                                })
                              }
                              className="text-purple-500 px-1"
                            >
                              ✏️
                            </button>
                            <button onClick={() => del(t.id)} className="text-red-400 px-1">
                              🗑️
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
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
  const toggleDay = (d: number) => {
    const has = draft.days_of_week.includes(d);
    onChange({
      ...draft,
      days_of_week: has
        ? draft.days_of_week.filter((x) => x !== d)
        : [...draft.days_of_week, d].sort(),
    });
  };

  const presetDays = (label: "weekdays" | "weekends" | "all") => {
    const days =
      label === "weekdays" ? [1, 2, 3, 4, 5] : label === "weekends" ? [0, 6] : [0, 1, 2, 3, 4, 5, 6];
    onChange({ ...draft, days_of_week: days });
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-extrabold text-purple-900">
            {draft.id ? "Rediger" : "Ny oppgave"}
          </h2>
          <button onClick={onClose} className="text-2xl text-purple-400">
            ✕
          </button>
        </div>

        <label className="block text-sm font-bold text-purple-700 mb-1">Navn</label>
        <input
          type="text"
          value={draft.title}
          onChange={(e) => onChange({ ...draft, title: e.target.value })}
          placeholder="F.eks. Rydde rommet"
          className="w-full px-3 py-2 rounded-xl border-2 border-purple-200 focus:border-purple-500 outline-none mb-3"
        />

        <label className="block text-sm font-bold text-purple-700 mb-1">
          Beskrivelse (valgfritt)
        </label>
        <input
          type="text"
          value={draft.description}
          onChange={(e) => onChange({ ...draft, description: e.target.value })}
          className="w-full px-3 py-2 rounded-xl border-2 border-purple-200 focus:border-purple-500 outline-none mb-3"
        />

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-sm font-bold text-purple-700 mb-1">
              Belønning (kr)
            </label>
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
            <label className="block text-sm font-bold text-purple-700 mb-1">
              XP for oppgaven
            </label>
            <input
              type="number"
              min={1}
              value={draft.xp_value}
              onChange={(e) => onChange({ ...draft, xp_value: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-xl border-2 border-purple-200 focus:border-purple-500 outline-none"
            />
          </div>
        </div>

        <label className="block text-sm font-bold text-purple-700 mb-1">Hyppighet</label>
        <select
          value={draft.recurrence}
          onChange={(e) => onChange({ ...draft, recurrence: e.target.value as Recurrence })}
          className="w-full px-3 py-2 rounded-xl border-2 border-purple-200 focus:border-purple-500 outline-none bg-white mb-3"
        >
          <option value="daily">Hver dag</option>
          <option value="days_of_week">Valgte dager</option>
          <option value="weekly">Én gang i uken (når som helst)</option>
          <option value="interval">Hver N. dag (intervall)</option>
          <option value="once">Kun én gang</option>
        </select>

        {draft.recurrence === "days_of_week" && (
          <div className="mb-3 bg-purple-50 rounded-2xl p-3">
            <div className="flex gap-1.5 mb-2">
              <button
                type="button"
                onClick={() => presetDays("weekdays")}
                className="text-xs font-bold px-2 py-1 rounded-full bg-white border border-purple-200"
              >
                Hverdager
              </button>
              <button
                type="button"
                onClick={() => presetDays("weekends")}
                className="text-xs font-bold px-2 py-1 rounded-full bg-white border border-purple-200"
              >
                Helger
              </button>
              <button
                type="button"
                onClick={() => presetDays("all")}
                className="text-xs font-bold px-2 py-1 rounded-full bg-white border border-purple-200"
              >
                Alle
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {[1, 2, 3, 4, 5, 6, 0].map((day) => {
                const selected = draft.days_of_week.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`py-2 rounded-lg text-xs font-bold transition-all ${
                      selected
                        ? "bg-purple-600 text-white"
                        : "bg-white text-purple-600 border border-purple-200"
                    }`}
                  >
                    {DAY_NAMES[day]}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {draft.recurrence === "interval" && (
          <div className="mb-3 bg-purple-50 rounded-2xl p-3">
            <label className="block text-sm font-bold text-purple-700 mb-1">
              Tilgjengelig hver N. dag (f.eks. 2 = annenhver dag)
            </label>
            <input
              type="number"
              min={1}
              value={draft.interval_days}
              onChange={(e) =>
                onChange({ ...draft, interval_days: Math.max(1, Number(e.target.value)) })
              }
              className="w-full px-3 py-2 rounded-xl border-2 border-purple-200 outline-none bg-white"
            />
          </div>
        )}

        <details className="mb-3">
          <summary className="text-sm font-bold text-purple-700 cursor-pointer select-none">
            ⏱️ Begrenset periode (valgfritt)
          </summary>
          <div className="grid grid-cols-2 gap-3 mt-2 bg-purple-50 rounded-2xl p-3">
            <div>
              <label className="block text-xs font-bold text-purple-700 mb-1">
                Start-dato
              </label>
              <input
                type="date"
                value={draft.start_date}
                onChange={(e) => onChange({ ...draft, start_date: e.target.value })}
                className="w-full px-2 py-1.5 rounded-lg border-2 border-purple-200 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-purple-700 mb-1">
                Slutt-dato
              </label>
              <input
                type="date"
                value={draft.end_date}
                onChange={(e) => onChange({ ...draft, end_date: e.target.value })}
                className="w-full px-2 py-1.5 rounded-lg border-2 border-purple-200 outline-none text-sm"
              />
            </div>
          </div>
        </details>

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
          <EmojiPicker
            value={draft.icon}
            onChange={(v) => onChange({ ...draft, icon: v })}
            type="task"
          />
        </div>

        <label className="block text-sm font-bold text-purple-700 mb-2">Farge</label>
        <ColorPicker value={draft.color} onChange={(v) => onChange({ ...draft, color: v })} />

        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="btn-ghost flex-1">
            Avbryt
          </button>
          <button onClick={onSave} className="btn-primary flex-1">
            {draft.id ? "Lagre" : "Opprett"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
