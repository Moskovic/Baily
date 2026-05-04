-- Mark a property as sold (date of sale).
-- When sold_at is not null, the property is considered sold and
-- typically excluded from active lists.
alter table public.properties
  add column if not exists sold_at date;
