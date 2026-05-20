"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured, getCurrentHouseholdId } from "@/lib/supabase";
import type { Bonus, BonusGoal, BonusPeriod, CustodyPeriod, Profile } from "@/lib/types";
import { formatKr, kronerToOre, startOfMonth, startOfWeek } from "@/lib/utils";
import { getCurrentPeriod } from "@/lib/periods";
import { EmojiPicker } from "@/components/EmojiPicker";
import SetupNotice from "@/components/SetupNotice";
import { AnimatePresence, motion } from "framer-motion";

type Draft = {
  id?: string;
  title: string;
  description: string;
  reward_kr: number;
  icon: string;
  target_child_id: string | null;
  goal_type: BonusGoal;
  goal_value_kr: number;
  goal_value_count: number;
  period: BonusPeriod;
  end_date: string | null;
  active: boolean;
};

const EMPTY: Draft = {
  title: "",
  description: "",
  reward_kr: 50,
  icon: "🏆",
  target_child_id: null,
  goal_type: "tasks_count",
  goal_value_kr: 100,
  goal_value_count: 10,
  period: "week",
  end_date: null,
  active: true,
};

export default function BonusPage() {
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [kids, setKids] = useState<Profile[]>([]);
  const [completions, setCompletions] = useState<{ child_id: string; reward_ore: number; completion_date: string; status: string }[]>([]);
  const [claims, setClaims] = useState<{ id: string; bonus_id: string; child_id: string; claimed_at: string; status: string }[]>([]);
  const [custodyPeriods, setCustodyPeriods] = useState<CustodyPeriod[]>([]);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyClaim, setBusyClaim] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const hid = await getCurrentHouseholdId();
    setHouseholdId(hid);
    const [bRes, kRes, cRes, clRes, pRes] = await Promise.all([
      supabase.from("bonuses").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").eq("role", "child").order("sort_order"),
      supabase.from("task_completions").select("child_id, reward_ore, completion_date, status").eq("status", "approved"),
      supabase.from("bonus_claims").select("id, bonus_id, child_id, claimed_at, status"),
      supabase.from("custody_periods").select("*"),
    ]);
    setBonuses((bRes.data as Bonus[]) ?? []);
    setKids((kRes.data as Profile[]) ?? []);
    setCompletions((cRes.data as never) ?? []);
    setClaims((clRes.data as never) ?? []);
    setCustodyPeriods((pRes.data as CustodyPeriod[]) ?? []);
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
    const goalValue =
      editing.goal_type === "amount"
        ? kronerToOre(editing.goal_value_kr)
        : editing.goal_type === "tasks_count"
        ? editing.goal_value_count
        : null;
    const payload = {
      household_id: householdId,
      title: editing.title.trim(),
      description: editing.description.trim() || null,
      reward_ore: kronerToOre(editing.reward_kr),
      icon: editing.icon,
      target_child_id: editing.target_child_id,
      goal_type: editing.goal_type,
      goal_value: goalValue,
      period: editing.period,
      end_date: editing.end_date,
      active: editing.active,
    };
    if (editing.id) {
      await supabase.from("bonuses").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("bonuses").insert(payload);
    }
    setEditing(null);
    reload();
  };

  const del = async (id: string) => {
    if (!confirm("Slett premien?")) return;
    await supabase.from("bonuses").delete().eq("id", id);
    reload();
  };

  const giveManually = async (bonus: Bonus, kid: Profile) => {
    if (!householdId) return;
    setBusyClaim(`${bonus.id}-${kid.id}`);
    await supabase.from("bonus_claims").insert({
      household_id: householdId,
      bonus_id: bonus.id,
      child_id: kid.id,
      reward_ore: bonus.reward_ore,
      status: "approved",
    });
    await supabase
      .from("profiles")
      .update({ balance_ore: kid.balance_ore + bonus.reward_ore })
      .eq("id", kid.id);
    setBusyClaim(null);
    reload();
  };

  const getProgress = (bonus: Bonus, kidId: string) => {
    const weekStart = startOfWeek().toISOString().slice(0, 10);
    const monthStart = startOfMonth().toISOString().slice(0, 10);
    const custody = bonus.period === "period" ? getCurrentPeriod(custodyPeriods, kidId) : null;
    const periodStart =
      bonus.period === "week"
        ? weekStart
        : bonus.period === "month"
        ? monthStart
        : bonus.period === "period"
        ? custody?.start ?? weekStart
        : bonus.start_date;
    const periodEnd = bonus.period === "period" ? custody?.end : null;
    const filtered = completions.filter(
      (c) =>
        c.child_id === kidId &&
        c.completion_date >= periodStart &&
        (!periodEnd || c.completion_date <= periodEnd)
    );
    let progress = 0;
    const goal = bonus.goal_value ?? 1;
    if (bonus.goal_type === "tasks_count") {
      progress = filtered.length;
    } else if (bonus.goal_type === "amount") {
      progress = filtered.reduce((s, c) => s + c.reward_ore, 0);
    }
    const claimed = claims.find(
      (c) => c.bonus_id === bonus.id && c.child_id === kidId && c.claimed_at >= periodStart
    );
    return { progress, goal, pct: goal > 0 ? Math.min(100, (progress / goal) * 100) : 0, claimed };
  };

  if (!isSupabaseConfigured) return <SetupNotice />;
  if (loading) return <div className="text-center py-12 text-4xl animate-float">🏆</div>;

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-purple-900">Premier</h1>
          <p className="text-purple-600 font-medium text-sm">Bonuser å motivere med</p>
        </div>
        <button onClick={() => setEditing({ ...EMPTY })} className="btn-primary">
          + Ny
        </button>
      </header>

      <div className="grid gap-3">
        <AnimatePresence>
          {bonuses.map((b) => {
            const targets = b.target_child_id ? kids.filter((k) => k.id === b.target_child_id) : kids;
            return (
              <motion.div
                key={b.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`card p-4 ${!b.active && "opacity-50"}`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="text-4xl">{b.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-extrabold text-purple-900 text-lg">{b.title}</div>
                    {b.description && <div className="text-xs text-purple-500">{b.description}</div>}
                    <div className="text-amber-600 font-extrabold mt-1">{formatKr(b.reward_ore)}</div>
                    <div className="text-xs text-purple-500 font-medium">
                      {b.period === "week" ? "Denne uka" : b.period === "month" ? "Denne måneden" : b.period === "period" ? "Per besøk" : "Egen periode"}
                      {" · "}
                      {b.goal_type === "tasks_count"
                        ? `${b.goal_value ?? 0} oppgaver`
                        : b.goal_type === "amount"
                        ? `${formatKr(b.goal_value ?? 0)} tjent`
                        : "Manuell godkjenning"}
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setEditing({
                        id: b.id,
                        title: b.title,
                        description: b.description ?? "",
                        reward_kr: b.reward_ore / 100,
                        icon: b.icon,
                        target_child_id: b.target_child_id,
                        goal_type: b.goal_type,
                        goal_value_kr: (b.goal_value ?? 0) / 100,
                        goal_value_count: b.goal_value ?? 10,
                        period: b.period,
                        end_date: b.end_date,
                        active: b.active,
                      })
                    }
                    className="text-purple-500 px-1"
                  >
                    ✏️
                  </button>
                  <button onClick={() => del(b.id)} className="text-red-400 px-1">
                    🗑️
                  </button>
                </div>

                <div className="space-y-2">
                  {targets.map((kid) => {
                    const p = getProgress(b, kid.id);
                    return (
                      <div key={kid.id} className="flex items-center gap-3">
                        <div className="text-2xl">{kid.avatar_emoji}</div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center text-xs font-bold text-purple-700">
                            <span>{kid.name}</span>
                            <span>
                              {b.goal_type === "amount"
                                ? `${formatKr(p.progress)} / ${formatKr(p.goal)}`
                                : b.goal_type === "tasks_count"
                                ? `${p.progress} / ${p.goal}`
                                : ""}
                            </span>
                          </div>
                          <div className="h-2 bg-purple-100 rounded-full overflow-hidden mt-0.5">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${p.pct}%`,
                                background: p.claimed
                                  ? "linear-gradient(90deg, #10b981, #06b6d4)"
                                  : "linear-gradient(90deg, #f59e0b, #ec4899)",
                              }}
                            />
                          </div>
                        </div>
                        {p.claimed ? (
                          <span className="text-xs font-bold text-green-600">✓ Gitt</span>
                        ) : b.goal_type === "manual" || p.pct >= 100 ? (
                          <button
                            disabled={busyClaim === `${b.id}-${kid.id}`}
                            onClick={() => giveManually(b, kid)}
                            className="text-xs font-bold bg-amber-400 text-amber-900 px-2 py-1 rounded-full active:scale-95"
                          >
                            Gi premie
                          </button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {bonuses.length === 0 && (
          <div className="card p-6 text-center">
            <div className="text-4xl mb-1">🏆</div>
            <p className="font-bold text-purple-900">Ingen premier enda</p>
            <p className="text-sm text-purple-500">Lag premier som motiverer til hardt arbeid!</p>
          </div>
        )}
      </div>

      {editing && (
        <BonusEditor
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

function BonusEditor({
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
          <h2 className="text-xl font-extrabold text-purple-900">{draft.id ? "Rediger" : "Ny premie"}</h2>
          <button onClick={onClose} className="text-2xl text-purple-400">✕</button>
        </div>

        <label className="block text-sm font-bold text-purple-700 mb-1">Navn</label>
        <input
          type="text"
          value={draft.title}
          onChange={(e) => onChange({ ...draft, title: e.target.value })}
          placeholder="F.eks. Kino-tur"
          className="w-full px-3 py-2 rounded-xl border-2 border-purple-200 focus:border-purple-500 outline-none mb-3"
        />

        <label className="block text-sm font-bold text-purple-700 mb-1">Beskrivelse</label>
        <input
          type="text"
          value={draft.description}
          onChange={(e) => onChange({ ...draft, description: e.target.value })}
          className="w-full px-3 py-2 rounded-xl border-2 border-purple-200 focus:border-purple-500 outline-none mb-3"
        />

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-sm font-bold text-purple-700 mb-1">Premie (kr)</label>
            <input
              type="number"
              min={0}
              value={draft.reward_kr}
              onChange={(e) => onChange({ ...draft, reward_kr: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-xl border-2 border-purple-200 focus:border-purple-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-purple-700 mb-1">Periode</label>
            <select
              value={draft.period}
              onChange={(e) => onChange({ ...draft, period: e.target.value as BonusPeriod })}
              className="w-full px-3 py-2 rounded-xl border-2 border-purple-200 focus:border-purple-500 outline-none bg-white"
            >
              <option value="period">Per besøksperiode</option>
              <option value="week">Ukentlig (man-søn)</option>
              <option value="month">Månedlig</option>
              <option value="custom">Egen</option>
            </select>
          </div>
        </div>

        <label className="block text-sm font-bold text-purple-700 mb-1">Type mål</label>
        <select
          value={draft.goal_type}
          onChange={(e) => onChange({ ...draft, goal_type: e.target.value as BonusGoal })}
          className="w-full px-3 py-2 rounded-xl border-2 border-purple-200 focus:border-purple-500 outline-none bg-white mb-3"
        >
          <option value="tasks_count">Antall oppgaver fullført</option>
          <option value="amount">Beløp tjent</option>
          <option value="manual">Manuell (du bestemmer)</option>
        </select>

        {draft.goal_type === "tasks_count" && (
          <div className="mb-3">
            <label className="block text-sm font-bold text-purple-700 mb-1">Antall oppgaver</label>
            <input
              type="number"
              min={1}
              value={draft.goal_value_count}
              onChange={(e) => onChange({ ...draft, goal_value_count: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-xl border-2 border-purple-200 focus:border-purple-500 outline-none"
            />
          </div>
        )}

        {draft.goal_type === "amount" && (
          <div className="mb-3">
            <label className="block text-sm font-bold text-purple-700 mb-1">Beløp som må tjenes (kr)</label>
            <input
              type="number"
              min={1}
              value={draft.goal_value_kr}
              onChange={(e) => onChange({ ...draft, goal_value_kr: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-xl border-2 border-purple-200 focus:border-purple-500 outline-none"
            />
          </div>
        )}

        <label className="block text-sm font-bold text-purple-700 mb-1">For hvem?</label>
        <select
          value={draft.target_child_id ?? ""}
          onChange={(e) => onChange({ ...draft, target_child_id: e.target.value || null })}
          className="w-full px-3 py-2 rounded-xl border-2 border-purple-200 focus:border-purple-500 outline-none bg-white mb-3"
        >
          <option value="">Alle barn</option>
          {kids.map((k) => (
            <option key={k.id} value={k.id}>{k.name}</option>
          ))}
        </select>

        <label className="block text-sm font-bold text-purple-700 mb-1">Ikon</label>
        <div className="mb-4">
          <EmojiPicker value={draft.icon} onChange={(v) => onChange({ ...draft, icon: v })} type="bonus" />
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="btn-ghost flex-1">Avbryt</button>
          <button onClick={onSave} className="btn-primary flex-1">{draft.id ? "Lagre" : "Opprett"}</button>
        </div>
      </motion.div>
    </div>
  );
}
