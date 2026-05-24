"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase, isSupabaseConfigured, setCurrentHouseholdId } from "@/lib/supabase";
import { useSession } from "@/lib/useSession";
import { TASK_TEMPLATES, ACTIVITY_PRESETS } from "@/lib/taskTemplates";
import { ColorPicker, EmojiPicker } from "@/components/EmojiPicker";
import ProfileAvatar from "@/components/ProfileAvatar";
import BirthdatePicker from "@/components/BirthdatePicker";
import SetupNotice from "@/components/SetupNotice";

type KidDraft = {
  name: string;
  birthdate: string;
  avatar_emoji: string;
  avatar_color: string;
  pin: string;
};

type ParentDraft = {
  display_name: string;
  pin: string;
};

type Step = 0 | 1 | 2 | 3 | 4 | 5;

const KID_EMOJIS = ["🦁", "🦄", "🦖", "🐉", "🦊", "🐰", "🐱", "🐶", "🦋", "🐬", "🚀", "🌟"];
const COLORS = ["#EC4899", "#3B82F6", "#10B981", "#F59E0B", "#A78BFA", "#06B6D4", "#84CC16", "#EF4444"];

export default function OnboardingPage() {
  const router = useRouter();
  const { session, loading: sessionLoading } = useSession();
  const [step, setStep] = useState<Step>(0);
  const [householdName, setHouseholdName] = useState("Min familie");
  const [parent, setParent] = useState<ParentDraft>({ display_name: "", pin: "1234" });
  const [kids, setKids] = useState<KidDraft[]>([
    {
      name: "",
      birthdate: "",
      avatar_emoji: "🦄",
      avatar_color: "#EC4899",
      pin: "1111",
    },
  ]);
  const [activity, setActivity] = useState<"easy" | "medium" | "high">("medium");
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionLoading) return;
    if (!session) router.replace("/auth/signin");
  }, [session, sessionLoading, router]);

  // Når aktivitetsnivå endres, oppdater de foreslåtte oppgavene
  useEffect(() => {
    setSelectedTaskIds(ACTIVITY_PRESETS[activity].suggestedIds);
  }, [activity]);

  const addKid = () => {
    if (kids.length >= 5) return;
    const used = kids.map((k) => k.avatar_emoji);
    const nextEmoji = KID_EMOJIS.find((e) => !used.includes(e)) ?? "⭐";
    setKids([
      ...kids,
      {
        name: "",
        birthdate: "",
        avatar_emoji: nextEmoji,
        avatar_color: COLORS[kids.length % COLORS.length],
        pin: String(1111 * (kids.length + 1)).slice(0, 4),
      },
    ]);
  };

  const removeKid = (i: number) => {
    setKids(kids.filter((_, idx) => idx !== i));
  };

  const updateKid = (i: number, patch: Partial<KidDraft>) => {
    setKids(kids.map((k, idx) => (idx === i ? { ...k, ...patch } : k)));
  };

  const canProceed = useMemo(() => {
    switch (step) {
      case 0: return !!householdName.trim();
      case 1: return kids.length > 0 && kids.every((k) => k.name.trim() && /^\d{4,6}$/.test(k.pin));
      case 2: return !!parent.display_name.trim() && /^\d{4,6}$/.test(parent.pin);
      case 3: return true; // aktivitetsnivå er alltid valgt
      case 4: return selectedTaskIds.length >= 1;
      default: return true;
    }
  }, [step, householdName, kids, parent, selectedTaskIds]);

  const handleFinish = async () => {
    if (!session) return;
    setCreating(true);
    setError(null);
    try {
      // 1) Opprett husholdning + medlem atomisk via RPC (hopper over RLS-fellen)
      const { data: householdId, error: hErr } = await supabase.rpc("create_household_with_owner", {
        p_name: householdName.trim(),
        p_display_name: parent.display_name.trim(),
      });
      if (hErr || !householdId) throw hErr ?? new Error("Kunne ikke opprette husholdning");

      // 2) Opprett parent-profil (for PIN-tilgang på delt enhet)
      const { error: pErr } = await supabase.from("profiles").insert({
        household_id: householdId,
        name: parent.display_name.trim(),
        role: "parent",
        pin: parent.pin,
        avatar_color: "#8B5CF6",
        avatar_emoji: "👑",
        sort_order: 0,
      });
      if (pErr) throw pErr;

      // 3) Opprett barn-profiler
      const kidRows = kids.map((k, i) => ({
        household_id: householdId,
        name: k.name.trim(),
        role: "child" as const,
        pin: k.pin,
        avatar_color: k.avatar_color,
        avatar_emoji: k.avatar_emoji,
        birthdate: k.birthdate || null,
        sort_order: i + 1,
      }));
      const { error: kErr } = await supabase.from("profiles").insert(kidRows);
      if (kErr) throw kErr;

      // 4) Opprett valgte oppgaver
      const chosenTasks = TASK_TEMPLATES.filter((t) => selectedTaskIds.includes(t.id));
      const taskRows = chosenTasks.map((t, i) => ({
        household_id: householdId,
        title: t.title,
        description: t.description || null,
        reward_ore: t.reward_ore,
        xp_value: t.xp_value,
        icon: t.icon,
        color: t.color,
        recurrence: t.recurrence,
        days_of_week: t.days_of_week ?? null,
        sort_order: i + 1,
      }));
      if (taskRows.length > 0) {
        const { error: tErr } = await supabase.from("tasks").insert(taskRows);
        if (tErr) throw tErr;
      }

      // 5) Standard strekk-bonus
      await supabase.from("streak_rewards").insert({
        household_id: householdId,
        title: "3-på-rad-bonus",
        description: "Nå Level 10 i tre perioder på rad",
        icon: "🔥",
        required_streak: 3,
        reward_ore: 5000,
      });

      // 6) Lagre household_id og gå videre
      setCurrentHouseholdId(householdId);
      router.push("/forelder");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Noe gikk galt";
      setError(msg);
      setCreating(false);
    }
  };

  if (!isSupabaseConfigured) return <SetupNotice />;
  if (sessionLoading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center text-6xl animate-float">🌟</div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-6 pb-32">
      <div className="w-full max-w-lg">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === step ? "w-8 bg-purple-600" : i < step ? "w-2 bg-purple-400" : "w-2 bg-purple-200"
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="text-center mb-6">
                <div className="text-6xl mb-2 animate-float">🏠</div>
                <h1 className="text-3xl font-extrabold text-purple-900">Velkommen!</h1>
                <p className="text-purple-600 font-medium">La oss sette opp familien din</p>
              </div>
              <div className="card p-5">
                <label className="block text-sm font-bold text-purple-700 mb-1">Hva heter familien?</label>
                <input
                  type="text"
                  value={householdName}
                  onChange={(e) => setHouseholdName(e.target.value)}
                  placeholder="F.eks. Familien Hansen"
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-purple-200 focus:border-purple-500 outline-none"
                />
                <p className="text-xs text-purple-500 mt-2">Vises i appen og på din profil. Du kan endre det senere.</p>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="text-center mb-4">
                <div className="text-6xl mb-2">👧👦</div>
                <h1 className="text-3xl font-extrabold text-purple-900">Hvem er barna?</h1>
                <p className="text-purple-600 font-medium text-sm">Du kan legge til/endre senere</p>
              </div>
              <div className="space-y-3">
                {kids.map((k, i) => (
                  <div key={i} className="card p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <ProfileAvatar emoji={k.avatar_emoji} color={k.avatar_color} size="md" />
                      <div className="flex-1">
                        <input
                          type="text"
                          value={k.name}
                          onChange={(e) => updateKid(i, { name: e.target.value })}
                          placeholder="Navn"
                          className="w-full px-3 py-2 rounded-xl border-2 border-purple-200 outline-none mb-2 font-bold"
                        />
                        <BirthdatePicker
                          value={k.birthdate}
                          onChange={(iso) => updateKid(i, { birthdate: iso })}
                        />
                      </div>
                      {kids.length > 1 && (
                        <button onClick={() => removeKid(i)} className="text-red-400 text-xl">🗑️</button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-purple-700 mb-1 block">Avatar</label>
                        <EmojiPicker
                          value={k.avatar_emoji}
                          onChange={(v) => updateKid(i, { avatar_emoji: v })}
                          type="profile"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-purple-700 mb-1 block">PIN (4-6 siffer)</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={k.pin}
                          onChange={(e) => updateKid(i, { pin: e.target.value.replace(/\D/g, "") })}
                          className="w-full px-3 py-2 rounded-xl border-2 border-purple-200 outline-none font-mono"
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="text-xs font-bold text-purple-700 mb-1 block">Farge</label>
                      <ColorPicker
                        value={k.avatar_color}
                        onChange={(v) => updateKid(i, { avatar_color: v })}
                      />
                    </div>
                  </div>
                ))}
                {kids.length < 5 && (
                  <button onClick={addKid} className="card w-full p-3 text-purple-600 font-bold border-2 border-dashed border-purple-300 hover:bg-purple-50">
                    + Legg til barn
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="text-center mb-4">
                <div className="text-6xl mb-2">👑</div>
                <h1 className="text-3xl font-extrabold text-purple-900">Din voksen-profil</h1>
                <p className="text-purple-600 font-medium text-sm">
                  Brukes for rask innlogging på delt enhet (iPad)
                </p>
              </div>
              <div className="card p-5">
                <label className="block text-sm font-bold text-purple-700 mb-1">Visningsnavn</label>
                <input
                  type="text"
                  value={parent.display_name}
                  onChange={(e) => setParent({ ...parent, display_name: e.target.value })}
                  placeholder="F.eks. Pappa eller Mamma"
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-purple-200 outline-none mb-3"
                />
                <label className="block text-sm font-bold text-purple-700 mb-1">PIN (4-6 siffer)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={parent.pin}
                  onChange={(e) => setParent({ ...parent, pin: e.target.value.replace(/\D/g, "") })}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-purple-200 outline-none font-mono"
                />
                <p className="text-xs text-purple-500 mt-2">
                  💡 Du logger inn med e-post + passord på din egen telefon. PIN-en er kun for å bytte profil
                  raskt på en delt enhet.
                </p>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="text-center mb-4">
                <div className="text-6xl mb-2">⚡</div>
                <h1 className="text-3xl font-extrabold text-purple-900">Hvor ambisiøst?</h1>
                <p className="text-purple-600 font-medium text-sm">
                  Hvor mange oppgaver bør barna gjøre per dag?
                </p>
              </div>
              <div className="space-y-3">
                {(Object.entries(ACTIVITY_PRESETS) as ["easy" | "medium" | "high", typeof ACTIVITY_PRESETS.easy][]).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => setActivity(key)}
                    className={`card w-full p-4 text-left transition-all ${
                      activity === key ? "ring-4 ring-purple-400 bg-purple-50" : ""
                    }`}
                  >
                    <div className="font-extrabold text-purple-900">{preset.label}</div>
                    <div className="text-sm text-purple-600">{preset.description}</div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="text-center mb-4">
                <div className="text-6xl mb-2">📝</div>
                <h1 className="text-3xl font-extrabold text-purple-900">Velg startoppgaver</h1>
                <p className="text-purple-600 font-medium text-sm">
                  {selectedTaskIds.length} valgt · du kan redigere alt senere
                </p>
              </div>
              <div className="grid gap-2 max-h-[60vh] overflow-y-auto pb-4">
                {TASK_TEMPLATES.map((t) => {
                  const checked = selectedTaskIds.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      onClick={() =>
                        setSelectedTaskIds(checked
                          ? selectedTaskIds.filter((id) => id !== t.id)
                          : [...selectedTaskIds, t.id])
                      }
                      className={`card p-3 flex items-center gap-3 text-left transition-all ${
                        checked ? "ring-2 ring-purple-400 bg-purple-50" : ""
                      }`}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                        style={{ background: `${t.color}33` }}
                      >
                        {t.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-purple-900 text-sm">{t.title}</div>
                        <div className="text-[10px] text-purple-500">
                          {(t.reward_ore / 100).toFixed(0)} kr · {t.xp_value} XP
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${checked ? "bg-purple-600 border-purple-600 text-white" : "border-purple-300"}`}>
                        {checked && "✓"}
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div key="5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="text-center mb-4">
                <div className="text-6xl mb-2 animate-float">🚀</div>
                <h1 className="text-3xl font-extrabold text-purple-900">Klar til lansering!</h1>
                <p className="text-purple-600 font-medium text-sm">Sjekk at alt stemmer</p>
              </div>
              <div className="card p-5 space-y-3">
                <div>
                  <div className="text-xs font-bold text-purple-500 uppercase">Familie</div>
                  <div className="font-extrabold text-purple-900">{householdName}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-purple-500 uppercase">Voksen</div>
                  <div className="font-extrabold text-purple-900">{parent.display_name} (PIN {parent.pin})</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-purple-500 uppercase">Barn ({kids.length})</div>
                  <div className="flex gap-2 flex-wrap mt-1">
                    {kids.map((k, i) => (
                      <div key={i} className="flex items-center gap-1.5 bg-purple-50 rounded-full px-2 py-1">
                        <span>{k.avatar_emoji}</span>
                        <span className="font-bold text-purple-900 text-sm">{k.name}</span>
                        <span className="text-xs text-purple-500 font-mono">{k.pin}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold text-purple-500 uppercase">Aktivitet</div>
                  <div className="font-extrabold text-purple-900">{ACTIVITY_PRESETS[activity].label}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-purple-500 uppercase">Startoppgaver</div>
                  <div className="font-extrabold text-purple-900">{selectedTaskIds.length} stk</div>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 text-xs text-amber-900 font-semibold">
                  ✨ Du får også en standard "3-på-rad-bonus" som gir 50 kr når et barn når Level 10 tre perioder på rad.
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-700 text-sm font-semibold p-3 rounded-xl mt-3">
                  {error}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-purple-100 p-4">
          <div className="max-w-lg mx-auto flex gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep((step - 1) as Step)}
                className="btn-ghost flex-1"
                disabled={creating}
              >
                ← Tilbake
              </button>
            )}
            {step < 5 ? (
              <button
                onClick={() => setStep((step + 1) as Step)}
                disabled={!canProceed}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                Neste →
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={creating}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {creating ? "Oppretter..." : "✓ Sett i gang!"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
