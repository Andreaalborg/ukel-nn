-- =====================================================================
-- v8: Flere tilpasningsmuligheter for Streak-bonuser
-- =====================================================================
-- Legger til:
--  * target_level: hvilket level barnet må nå hver periode (default 10)
--  * auto_award: gi bonusen automatisk når kravet er oppnådd
-- =====================================================================

alter table streak_rewards
  add column if not exists target_level integer not null default 10
    check (target_level between 1 and 10),
  add column if not exists auto_award boolean not null default false;

-- Eksisterende rader bruker default = 10 (status quo)
