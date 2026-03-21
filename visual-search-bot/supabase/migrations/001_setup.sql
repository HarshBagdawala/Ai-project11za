-- Enable pgvector
create extension if not exists vector;

-- Products table
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  color text,
  style text,
  price numeric(10,2) not null,
  image_url text not null,
  buy_url text not null,
  description text,
  embedding vector(1024),
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Search logs table
create table if not exists search_logs (
  id uuid primary key default gen_random_uuid(),
  customer_phone text not null,
  image_url text,
  detected_tags jsonb,
  matched_product_ids uuid[],
  response_sent boolean default false,
  created_at timestamptz default now()
);

-- RLS
alter table products enable row level security;
alter table search_logs enable row level security;

create policy "Service role full access on products"
  on products for all using (true);

create policy "Service role full access on search_logs"
  on search_logs for all using (true);

-- pgvector similarity search RPC
create or replace function match_products(
  query_embedding vector(1024),
  match_count int default 3,
  similarity_threshold float default 0.5
)
returns table (
  id uuid,
  name text,
  price numeric,
  image_url text,
  buy_url text,
  category text,
  color text,
  similarity float
)
language sql stable as $$
  select
    id, name, price, image_url, buy_url, category, color,
    1 - (embedding <=> query_embedding) as similarity
  from products
  where is_active = true
    and 1 - (embedding <=> query_embedding) > similarity_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$;

-- Updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger products_updated_at
  before update on products
  for each row execute function update_updated_at();

-- Create indexes for better performance
create index if not exists idx_products_category on products(category);
create index if not exists idx_products_active on products(is_active);
create index if not exists idx_search_logs_phone on search_logs(customer_phone);
