// Standardoppgaver som foreldre kan velge fra under onboarding.
// Belønningene er målrettet mot ~50 kr/uke pr. barn ved aktivitetsnivå "medium".

export type TaskTemplate = {
  id: string;
  title: string;
  description: string;
  reward_ore: number; // i øre
  xp_value: number;
  icon: string;
  color: string;
  recurrence: "daily" | "weekly" | "days_of_week";
  days_of_week?: number[];
  category: "morgen" | "kveld" | "kjøkken" | "lekse" | "rydde" | "lek" | "hjem";
};

export const TASK_TEMPLATES: TaskTemplate[] = [
  // Morgen
  { id: "seng", title: "Re seng", description: "Re sengen din om morgenen", reward_ore: 200, xp_value: 10, icon: "🛏️", color: "#FFD93D", recurrence: "daily", category: "morgen" },
  { id: "tenner-morgen", title: "Pusse tenner (morgen)", description: "", reward_ore: 200, xp_value: 10, icon: "🪥", color: "#06B6D4", recurrence: "daily", category: "morgen" },
  { id: "kle-pa", title: "Kle på selv", description: "", reward_ore: 200, xp_value: 10, icon: "👕", color: "#A78BFA", recurrence: "daily", category: "morgen" },
  { id: "frokost-rydde", title: "Rydde etter frokost", description: "", reward_ore: 300, xp_value: 10, icon: "🥐", color: "#F59E0B", recurrence: "daily", category: "morgen" },

  // Kveld
  { id: "tenner-kveld", title: "Pusse tenner (kveld)", description: "", reward_ore: 200, xp_value: 10, icon: "🪥", color: "#06B6D4", recurrence: "daily", category: "kveld" },
  { id: "klare-skolesekk", title: "Klargjøre skolesekk", description: "Pakk ferdig for neste dag", reward_ore: 300, xp_value: 10, icon: "🎒", color: "#EC4899", recurrence: "days_of_week", days_of_week: [0, 1, 2, 3, 4], category: "kveld" },
  { id: "dusje", title: "Dusje", description: "", reward_ore: 300, xp_value: 10, icon: "🚿", color: "#06B6D4", recurrence: "daily", category: "kveld" },

  // Kjøkken
  { id: "tomme-oppvask", title: "Tømme oppvaskmaskin", description: "", reward_ore: 400, xp_value: 15, icon: "🍽️", color: "#10B981", recurrence: "daily", category: "kjøkken" },
  { id: "dekke-bord", title: "Dekke bordet", description: "", reward_ore: 300, xp_value: 10, icon: "🍴", color: "#10B981", recurrence: "daily", category: "kjøkken" },
  { id: "rydde-bord", title: "Rydde av bordet", description: "", reward_ore: 300, xp_value: 10, icon: "🧽", color: "#10B981", recurrence: "daily", category: "kjøkken" },
  { id: "hjelpe-middag", title: "Hjelpe med middag", description: "", reward_ore: 500, xp_value: 15, icon: "🍳", color: "#EF4444", recurrence: "weekly", category: "kjøkken" },

  // Lekser & lesing
  { id: "lekser", title: "Gjøre lekser", description: "Uten å bli sur", reward_ore: 400, xp_value: 15, icon: "📚", color: "#F59E0B", recurrence: "days_of_week", days_of_week: [1, 2, 3, 4, 5], category: "lekse" },
  { id: "lese", title: "Lese 15 minutter", description: "", reward_ore: 300, xp_value: 10, icon: "📖", color: "#EC4899", recurrence: "daily", category: "lekse" },

  // Rydding
  { id: "rydde-rom", title: "Rydde rommet", description: "Holde det pent", reward_ore: 500, xp_value: 15, icon: "🧹", color: "#A78BFA", recurrence: "daily", category: "rydde" },
  { id: "vask-toy", title: "Bringe ned skittentøy", description: "", reward_ore: 200, xp_value: 10, icon: "🧺", color: "#EC4899", recurrence: "weekly", category: "rydde" },
  { id: "stovsuge", title: "Støvsuge eget rom", description: "", reward_ore: 500, xp_value: 15, icon: "🧹", color: "#A78BFA", recurrence: "weekly", category: "rydde" },
  { id: "soppel", title: "Bære ut søppel", description: "", reward_ore: 300, xp_value: 10, icon: "🗑️", color: "#6B7280", recurrence: "weekly", category: "rydde" },

  // Lek & fritid
  { id: "lufte-hund", title: "Lufte hunden", description: "", reward_ore: 400, xp_value: 15, icon: "🐶", color: "#84CC16", recurrence: "daily", category: "lek" },
  { id: "vanne-blomster", title: "Vanne blomster", description: "", reward_ore: 200, xp_value: 10, icon: "🌱", color: "#10B981", recurrence: "weekly", category: "hjem" },
  { id: "samle-leker", title: "Samle leker i stua", description: "", reward_ore: 200, xp_value: 10, icon: "🧸", color: "#FFD93D", recurrence: "daily", category: "rydde" },
  { id: "trening", title: "Fysisk aktivitet 30 min", description: "Løpe, sykle, fotball etc.", reward_ore: 400, xp_value: 15, icon: "🏃", color: "#EF4444", recurrence: "daily", category: "lek" },
];

export const ACTIVITY_PRESETS = {
  easy: {
    label: "Rolig (2-3 oppg/dag)",
    description: "Passer for små barn eller travle familier",
    suggestedIds: ["seng", "tenner-morgen", "tenner-kveld", "lese", "rydde-rom"],
  },
  medium: {
    label: "Vanlig (4-5 oppg/dag)",
    description: "Anbefalt for de fleste — ~50 kr/uke ved full innsats",
    suggestedIds: [
      "seng", "tenner-morgen", "tenner-kveld", "kle-pa", "rydde-rom",
      "lekser", "lese", "tomme-oppvask", "soppel"
    ],
  },
  high: {
    label: "Ambisiøst (6+ oppg/dag)",
    description: "For barn som virkelig vil samle XP og premier",
    suggestedIds: [
      "seng", "tenner-morgen", "tenner-kveld", "kle-pa", "frokost-rydde",
      "rydde-rom", "lekser", "lese", "tomme-oppvask", "dekke-bord",
      "rydde-bord", "samle-leker", "trening", "vask-toy", "stovsuge", "soppel"
    ],
  },
};
