export type Role = "child" | "parent";

export type Household = {
  id: string;
  name: string;
  plan: "free" | "trial" | "family" | "family_plus" | "lifetime" | "beta";
  trial_ends_at: string | null;
  subscription_status: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  current_period_end: string | null;
  lifetime: boolean;
  created_at: string;
  updated_at: string;
};

export type HouseholdMember = {
  id: string;
  household_id: string;
  user_id: string;
  role: "owner" | "co_parent";
  display_name: string | null;
  created_at: string;
};

export type HouseholdInvite = {
  id: string;
  household_id: string;
  invited_by: string | null;
  invited_email: string;
  token: string;
  role: "co_parent";
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
};
export type Recurrence = "daily" | "weekly" | "once" | "days_of_week" | "interval";
export type CompletionStatus = "pending" | "approved" | "rejected";
export type BonusGoal = "tasks_count" | "amount" | "manual";
export type BonusPeriod = "week" | "month" | "custom" | "period";

export type Profile = {
  id: string;
  household_id: string;
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
  household_id: string;
  title: string;
  description: string | null;
  reward_ore: number;
  icon: string;
  color: string;
  recurrence: Recurrence;
  days_of_week: number[] | null;
  interval_days: number | null;
  start_date: string | null;
  end_date: string | null;
  xp_value: number;
  assigned_to: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
};

export type TaskCompletion = {
  id: string;
  household_id: string;
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
  household_id: string;
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
  household_id: string;
  bonus_id: string;
  child_id: string;
  status: "pending" | "approved";
  reward_ore: number;
  claimed_at: string;
  reviewed_by: string | null;
};

export type Payout = {
  id: string;
  household_id: string;
  child_id: string;
  amount_ore: number;
  note: string | null;
  paid_at: string;
  paid_by: string | null;
};

export type Badge = {
  id: string;
  household_id: string;
  child_id: string;
  badge_type: string;
  earned_at: string;
};

export type CustodyPeriod = {
  id: string;
  household_id: string;
  child_id: string;
  start_date: string;
  end_date: string;
  label: string | null;
  closed: boolean;
  created_at: string;
};

export type PeriodAchievement = {
  id: string;
  household_id: string;
  child_id: string;
  period_id: string | null;
  period_start: string;
  period_end: string;
  max_level: number;
  xp_earned: number;
  tasks_completed: number;
  ore_earned: number;
  reached_max: boolean;
  created_at: string;
};

export type StreakReward = {
  id: string;
  household_id: string;
  child_id: string | null;
  title: string;
  description: string | null;
  icon: string;
  required_streak: number;
  reward_ore: number;
  active: boolean;
  created_at: string;
};

export type StreakClaim = {
  id: string;
  household_id: string;
  streak_reward_id: string;
  child_id: string;
  streak_count: number;
  reward_ore: number;
  awarded_at: string;
};
