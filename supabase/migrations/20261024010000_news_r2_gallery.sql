alter table public.news
add column if not exists gallery_images jsonb not null default '[]'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'news_gallery_images_valid'
      and conrelid = 'public.news'::regclass
  ) then
    alter table public.news
    add constraint news_gallery_images_valid
    check (
      jsonb_typeof(gallery_images) = 'array'
      and jsonb_array_length(gallery_images) <= 20
    );
  end if;
end
$$;
