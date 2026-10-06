-- รันใน Supabase > SQL Editor > Run (รันครั้งเดียวพอ)
alter table sheets add column if not exists title text;
alter table sheets add column if not exists views int default 0;
alter table profiles add column if not exists avatar_url text;

create or replace function inc_view(sid bigint) returns void
language sql security definer as
$$ update sheets set views = coalesce(views,0) + 1 where id = sid $$;
grant execute on function inc_view(bigint) to authenticated;
