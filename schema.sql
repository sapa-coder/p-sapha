-- วางทั้งหมดนี้ใน Supabase > SQL Editor > Run
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text, classroom text, email text,
  is_admin boolean default false, created_at timestamptz default now());

create table sheets (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users on delete set null,
  author_name text, classroom text, grade int,
  subject text, description text,
  file_url text, thumb_url text, created_at timestamptz default now());

create table puffet (
  id bigint generated always as identity primary key,
  title text, description text, image_url text, link_url text,
  created_at timestamptz default now());

create table favorites (
  user_id uuid references auth.users on delete cascade,
  sheet_id bigint references sheets on delete cascade,
  primary key (user_id, sheet_id));

create function is_admin() returns boolean language sql security definer as
$$ select coalesce((select is_admin from profiles where id = auth.uid()), false) $$;

-- สร้างโปรไฟล์อัตโนมัติตอนสมัคร
create function handle_new_user() returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, full_name, classroom, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'classroom', new.email);
  return new;
end $$;
create trigger on_signup after insert on auth.users for each row execute function handle_new_user();

alter table profiles enable row level security;
alter table sheets enable row level security;
alter table puffet enable row level security;
alter table favorites enable row level security;

create policy "own profile" on profiles for select using (auth.uid() = id or is_admin());
create policy "admin edit profile" on profiles for all using (is_admin());
create policy "read sheets" on sheets for select using (auth.role() = 'authenticated');
create policy "add sheets" on sheets for insert with check (auth.uid() = user_id);
create policy "edit own sheets" on sheets for update using (auth.uid() = user_id or is_admin());
create policy "delete own sheets" on sheets for delete using (auth.uid() = user_id or is_admin());
create policy "read puffet" on puffet for select using (auth.role() = 'authenticated');
create policy "admin puffet" on puffet for all using (is_admin());
create policy "own favs" on favorites for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ที่เก็บไฟล์
insert into storage.buckets (id, name, public) values ('files', 'files', true);
create policy "public read files" on storage.objects for select using (bucket_id = 'files');
create policy "upload files" on storage.objects for insert to authenticated with check (bucket_id = 'files');
create policy "admin files" on storage.objects for all using (bucket_id = 'files' and is_admin());
