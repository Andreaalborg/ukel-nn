-- Hotfix v2: cast algorithm arg to text (digest(bytea, unknown) → digest(bytea, text))
create or replace function _hash_session_token(p_token text)
returns text
language sql
immutable
as $$
  select encode(digest(convert_to(p_token, 'UTF8'), 'sha256'::text), 'hex');
$$;
