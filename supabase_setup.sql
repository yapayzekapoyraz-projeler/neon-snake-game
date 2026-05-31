-- -------------------------------------------------------------
-- SUPABASE YILAN OYUNU SETUP SQL
-- -------------------------------------------------------------
-- Bu dosyayı Supabase panelinizdeki SQL Editor'e yapıştırıp 
-- "Run" butonuna basarak tablolarınızı oluşturabilirsiniz.

-- 1. Kullanıcı Profilleri Tablosu (Skinler ve Puanlar)
create table if not exists public.user_profiles (
    id uuid default gen_random_uuid() primary key,
    username text unique not null,
    total_points integer default 0,
    unlocked_skins text[] default array['classic'],
    active_skin text default 'classic',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Liderlik Tablosu (Skorlar)
create table if not exists public.leaderboard (
    id bigint generated always as identity primary key,
    username text not null,
    score integer not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Row Level Security (RLS) - Satır Düzeyinde Güvenlik Aktifleştirme
alter table public.user_profiles enable row level security;
alter table public.leaderboard enable row level security;

-- 4. Herkese Açık Okuma ve Yazma Politikaları (Güvenlik için Anonim Erişim)
create policy "Profiles are viewable by everyone" on public.user_profiles
    for select using (true);

create policy "Profiles can be inserted by everyone" on public.user_profiles
    for insert with check (true);

create policy "Profiles can be updated by everyone" on public.user_profiles
    for update using (true);

create policy "Leaderboard is viewable by everyone" on public.leaderboard
    for select using (true);

create policy "Leaderboard entries can be inserted by everyone" on public.leaderboard
    for insert with check (true);
