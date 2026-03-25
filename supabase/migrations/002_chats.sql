-- Chats table for conversational history
create table if not exists chats (
  id uuid primary key default gen_random_uuid(),
  customer_phone text not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz default now()
);

-- RLS
alter table chats enable row level security;

create policy "Service role full access on chats"
  on chats for all using (true);

-- Index for faster lookup by phone number
create index if not exists idx_chats_phone on chats(customer_phone);
