-- Adds a column to store the user's drawn signature as a base64 PNG data URL.
alter table public.profiles
  add column if not exists signature_data_url text;
