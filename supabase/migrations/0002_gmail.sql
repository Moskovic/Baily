-- Adds columns to store the Gmail connection for a profile.
alter table public.profiles
  add column if not exists gmail_email text,
  add column if not exists gmail_connected_at timestamptz;
