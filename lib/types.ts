export type Role = "child" | "parent";
export type Recurrence = "daily" | "weekly" | "once";
export type CompletionStatus = "pending" | "approved" | "rejected";
export type BonusGoal = "tasks_count" | "amount" | "manual";
export type BonusPeriod = "week" | "month" | "custom";

export type Profile = {
  id: string;
  name: string;
  role: Role;
  pin: string;
  avatar_color: string;
  avatar_emoji: string;
  birthdate: string | null;
  xp: number;
  balance_ore: number;
  sort_order: number;
  created_at: string;
};

export type Task = {
  id: string;
  title: string;
  description: string | null;
  reward_ore: number;
  icon: string;
  color: string;
  recurrence: Recurrence;
  assigned_to: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
};

export type TaskCompletion = {
  id: string;
  task_id: string;
  child_id: string;
  status: CompletionStatus;
  reward_ore: number;
  completion_date: string;
  completed_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
};

export type Bonus = {
  id: string;
  title: string;
  description: string | null;
  reward_ore: number;
  icon: string;
  target_child_id: string | null;
  goal_type: BonusGoal;
  goal_value: number | null;
  period: BonusPeriod;
  start_date: string;
  end_date: string | null;
  active: boolean;
  created_at: string;
};

export type BonusClaim = {
  id: string;
  bonus_id: string;
  child_id: string;
  status: "pending" | "approved";
  reward_ore: number;
  claimed_at: string;
  reviewed_by: string | null;
};

export type Payout = {
  id: string;
  child_id: string;
  amount_ore: number;
  note: string | null;
  paid_at: string;
  paid_by: string | null;
};

export type Badge = {
  id: string;
  child_id: string;
  badge_type: string;
  earned_at: string;
};
