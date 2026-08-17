-- ===================================================================
-- 在 Supabase 后台运行这段（只需一次）
-- 打开 supabase.com 你的项目 → 左侧菜单 SQL Editor → New query
-- 把下面全部粘进去 → 点右下角 Run。出现 Success 就好了。
-- ===================================================================

-- 1) 建存储桶 photos（公开可读，用来存照片文件）
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

-- 2) 建数据表 photos（存每张照片属于哪个相册、路径、旁白、地点）
create table if not exists public.photos (
  id         bigint generated always as identity primary key,
  album      text not null,
  path       text not null,
  caption    text default '',
  place      text default '',
  created_at timestamptz default now()
);
-- 如果之前已经建过表（没有 place 列），跑下面这行补上即可，不会重复加：
alter table public.photos add column if not exists place text default '';
alter table public.photos enable row level security;

-- 3) 权限：任何人都能读；上传/删除也放开（私人小站，链接不公开即可）
drop policy if exists "photos_read"   on public.photos;
drop policy if exists "photos_insert" on public.photos;
drop policy if exists "photos_delete" on public.photos;
drop policy if exists "photos_update" on public.photos;
create policy "photos_read"   on public.photos for select using (true);
create policy "photos_insert" on public.photos for insert with check (true);
create policy "photos_delete" on public.photos for delete using (true);
create policy "photos_update" on public.photos for update using (true);

-- 4) 存储桶文件的读写权限
drop policy if exists "photos_obj_read"   on storage.objects;
drop policy if exists "photos_obj_insert" on storage.objects;
drop policy if exists "photos_obj_delete" on storage.objects;
create policy "photos_obj_read"   on storage.objects for select using (bucket_id = 'photos');
create policy "photos_obj_insert" on storage.objects for insert with check (bucket_id = 'photos');
create policy "photos_obj_delete" on storage.objects for delete using (bucket_id = 'photos');
