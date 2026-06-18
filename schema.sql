-- ══════════════════════════════════════════════════════════════════════════════
-- UGET Blog — Neon PostgreSQL Schema
-- ══════════════════════════════════════════════════════════════════════════════

-- users table (replaces auth.users)
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- profiles table (extends users)
create table if not exists public.profiles (
  id uuid references public.users(id) on delete cascade primary key,
  username text unique,
  full_name text,
  avatar_url text,
  bio text,
  twitter text,
  website text,
  role text not null default 'writer' check (role in ('admin', 'writer', 'reader')),
  theme text default 'light' check (theme in ('light', 'dark', 'system')),
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

-- follows table
create table if not exists public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid references public.profiles(id) on delete cascade not null,
  following_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(follower_id, following_id)
);

-- notifications table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null,
  actor_id uuid references public.profiles(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  content text not null,
  read boolean default false not null,
  created_at timestamptz default now()
);

create index if not exists notifications_user_idx on public.notifications(user_id, created_at desc);
create index if not exists follows_follower_idx on public.follows(follower_id);
create index if not exists follows_following_idx on public.follows(following_id);

-- ── Auto-update updated_at ────────────────────────────────────────────────────
create or replace function public.update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create or replace trigger posts_updated_at before update on public.posts for each row execute procedure public.update_updated_at();
create or replace trigger profiles_updated_at before update on public.profiles for each row execute procedure public.update_updated_at();
create or replace trigger users_updated_at before update on public.users for each row execute procedure public.update_updated_at();

-- ── Indexes ───────────────────────────────────────────────────────────────────
create index if not exists posts_author_idx on public.posts(author_id);
create index if not exists posts_category_idx on public.posts(category);
create index if not exists posts_published_idx on public.posts(published, created_at desc);
create index if not exists posts_slug_idx on public.posts(slug);
