-- Add a type column to properties (apartment | garage).
alter table public.properties
  add column if not exists type text not null default 'apartment'
  check (type in ('apartment', 'garage'));
