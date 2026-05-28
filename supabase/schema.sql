-- ══════════════════════════════════════════════════════════════════════════════
-- UGET Blog — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ══════════════════════════════════════════════════════════════════════════════

-- profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique,
  full_name text,
  avatar_url text,
  bio text,
  twitter text,
  website text,
  role text not null default 'writer' check (role in ('admin', 'writer', 'reader')),
  follower_count integer default 0,
  post_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- posts table
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  excerpt text,
  content text not null default '',
  cover_image text,
  category text not null default 'general',
  tags text[] default '{}',
  author_id uuid references public.profiles(id) on delete cascade not null,
  published boolean default false,
  featured boolean default false,
  read_time integer default 1,
  view_count integer default 0,
  like_count integer default 0,
  comment_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- likes table
create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(post_id, user_id)
);

-- bookmarks table
create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(post_id, user_id)
);

-- comments table
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

-- ── Row Level Security ────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.likes enable row level security;
alter table public.bookmarks enable row level security;
alter table public.comments enable row level security;

-- profiles: anyone can read, only self can write
create policy "profiles_public_read" on public.profiles for select using (true);
create policy "profiles_self_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_self_update" on public.profiles for update using (auth.uid() = id);

-- posts: anyone can read published, authors can CRUD own
create policy "posts_public_read" on public.posts for select using (published = true or auth.uid() = author_id);
create policy "posts_author_insert" on public.posts for insert with check (auth.uid() = author_id);
create policy "posts_author_update" on public.posts for update using (auth.uid() = author_id);
create policy "posts_author_delete" on public.posts for delete using (auth.uid() = author_id);

-- likes: auth users can read all, write own
create policy "likes_public_read" on public.likes for select using (true);
create policy "likes_self_write" on public.likes for insert with check (auth.uid() = user_id);
create policy "likes_self_delete" on public.likes for delete using (auth.uid() = user_id);

-- bookmarks: only self
create policy "bookmarks_self" on public.bookmarks for all using (auth.uid() = user_id);

-- comments: anyone read, auth write own
create policy "comments_public_read" on public.comments for select using (true);
create policy "comments_self_insert" on public.comments for insert with check (auth.uid() = user_id);
create policy "comments_self_delete" on public.comments for delete using (auth.uid() = user_id);

-- ── Auto-create profile on signup ─────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
    lower(regexp_replace(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), '[^a-zA-Z0-9]', '', 'g')) || floor(random()*9000+1000)::text
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Auto-update updated_at ────────────────────────────────────────────────────
create or replace function public.update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger posts_updated_at before update on public.posts for each row execute procedure public.update_updated_at();
create trigger profiles_updated_at before update on public.profiles for each row execute procedure public.update_updated_at();

-- ── Storage bucket for images ─────────────────────────────────────────────────
insert into storage.buckets (id, name, public) values ('post-images', 'post-images', true) on conflict do nothing;
create policy "post_images_public_read" on storage.objects for select using (bucket_id = 'post-images');
create policy "post_images_auth_upload" on storage.objects for insert with check (bucket_id = 'post-images' and auth.role() = 'authenticated');
create policy "post_images_own_delete" on storage.objects for delete using (bucket_id = 'post-images' and auth.uid()::text = (storage.foldername(name))[1]);

-- ── Indexes ───────────────────────────────────────────────────────────────────
create index if not exists posts_author_idx on public.posts(author_id);
create index if not exists posts_category_idx on public.posts(category);
create index if not exists posts_published_idx on public.posts(published, created_at desc);
create index if not exists posts_slug_idx on public.posts(slug);
