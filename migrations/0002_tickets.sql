create table if not exists tickets (
  id          serial primary key,
  handle_hash text not null unique,
  created_at  timestamptz not null default now()
);
