-- =====================================================================
-- v9: Klokkeslett på oppgaver — grunnlag for vertikal familiekalender
-- =====================================================================
-- Legger til et valgfritt tidspunkt (HH:MM) på oppgaver, slik at de kan
-- plasseres på riktig sted i dagsplan-kalenderen. Oppgaver uten tidspunkt
-- vises i en "Når som helst"-seksjon.
-- =====================================================================

alter table tasks
  add column if not exists due_time time;

comment on column tasks.due_time is
  'Valgfritt klokkeslett oppgaven er ment å gjøres på (brukes i dagsplan-kalenderen). Null = når som helst.';
