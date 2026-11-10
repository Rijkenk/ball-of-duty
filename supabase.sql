-- Ball of Duty: database-opzet voor Supabase.
-- Plak dit in Supabase > SQL Editor en klik Run.
-- Pas eerst de teamcode aan (onderaan bij INSERT INTO team_secret).

create table if not exists public.opgaves (
  match int not null,
  player text not null,
  status text not null default '' check (status in ('', 'ja', 'misschien', 'nee')),
  prefs text[] not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (match, player)
);


create table if not exists public.team_secret (
  id int primary key default 1 check (id = 1),
  code text not null
);

alter table public.opgaves enable row level security;
alter table public.team_secret enable row level security;

-- Iedereen met de app mag lezen; schrijven gaat alleen via de functies hieronder.
drop policy if exists "lezen" on public.opgaves;
create policy "lezen" on public.opgaves for select using (true);
-- team_secret krijgt geen policy: niemand kan de code uitlezen.

create or replace function public.check_code(p_code text) returns boolean
language sql security definer set search_path = public as $$
  select exists (select 1 from team_secret where code = p_code);
$$;

create or replace function public.set_opgave(p_code text, p_match int, p_player text, p_status text, p_prefs text[])
returns void language plpgsql security definer set search_path = public as $$
begin
  if not check_code(p_code) then raise exception 'bad_code'; end if;
  if coalesce(array_length(array_remove(p_prefs, 'k9b'), 1), 0) > 2 then raise exception 'te veel voorkeuren'; end if;
  insert into opgaves (match, player, status, prefs, updated_at)
  values (p_match, p_player, coalesce(p_status, ''), coalesce(p_prefs, '{}'), now())
  on conflict (match, player) do update
    set status = excluded.status, prefs = excluded.prefs, updated_at = now();
end $$;


grant execute on function public.check_code(text) to anon;
grant execute on function public.set_opgave(text, int, text, text, text[]) to anon;

-- Live bijwerken in de app
do $$ begin
  alter publication supabase_realtime add table public.opgaves;
exception when duplicate_object then null; end $$;

-- KIES HIER JULLIE TEAMCODE
insert into public.team_secret (id, code) values (1, 'VERANDER-MIJ')
on conflict (id) do update set code = excluded.code;
