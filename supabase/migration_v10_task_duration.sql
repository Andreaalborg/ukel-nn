-- =====================================================================
-- v10: Varighet på oppgaver — for bredden på blokker i dagsplan-kalenderen
-- =====================================================================
-- Default 15 minutter. Foreldre kan endre per oppgave under Oppgaver.
-- =====================================================================

alter table tasks
  add column if not exists duration_minutes integer not null default 15
    check (duration_minutes > 0 and duration_minutes <= 480);

comment on column tasks.duration_minutes is
  'Antatt varighet i minutter, default 15. Brukes til bredden på oppgaveblokken i dagsplan-kalenderen.';
