
create table if not exists public.outfits (
  id uuid primary key default gen_random_uuid(),
  author text not null default 'anon',
  title text not null,
  description text,
  image_url text not null,
  items jsonb not null default '[]'::jsonb,
  views integer not null default 0,
  likes integer not null default 0,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now()
);

grant select, insert, update on public.outfits to anon, authenticated;
grant all on public.outfits to service_role;

create index if not exists outfits_created_at_idx on public.outfits (created_at desc);

create table if not exists public.outfit_likes (
  outfit_id uuid not null references public.outfits(id) on delete cascade,
  ip_hash text not null,
  created_at timestamptz not null default now(),
  primary key (outfit_id, ip_hash)
);

grant select, insert on public.outfit_likes to anon, authenticated;
grant all on public.outfit_likes to service_role;

create or replace function public.bump_outfit_likes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.outfits set likes = likes + 1 where id = new.outfit_id;
  return new;
end;
$$;

drop trigger if exists trg_bump_outfit_likes on public.outfit_likes;
create trigger trg_bump_outfit_likes
  after insert on public.outfit_likes
  for each row execute function public.bump_outfit_likes();

alter table public.outfits enable row level security;
alter table public.outfit_likes enable row level security;

drop policy if exists "outfits public read" on public.outfits;
create policy "outfits public read" on public.outfits for select using (is_hidden = false);

drop policy if exists "outfits public insert" on public.outfits;
create policy "outfits public insert" on public.outfits for insert with check (true);

drop policy if exists "outfit_likes public insert" on public.outfit_likes;
create policy "outfit_likes public insert" on public.outfit_likes for insert with check (true);

drop policy if exists "outfit_likes public read" on public.outfit_likes;
create policy "outfit_likes public read" on public.outfit_likes for select using (true);
