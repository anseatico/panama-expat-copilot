-- Panama Expat Copilot — Esquema Supabase
-- Ejecutar en SQL Editor del dashboard de Supabase.

create extension if not exists vector;

-- Perfil + estado de suscripción (1:1 con auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  stripe_customer_id text,
  plan text not null default 'free' check (plan in ('free','onetime','monthly')),
  credits int not null default 0,
  created_at timestamptz not null default now()
);

-- Documentos subidos (metadatos; el binario vive en Storage bucket 'documents')
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module text not null check (module in ('housing','receipts','health','insurance')),
  storage_path text not null,
  filename text,
  created_at timestamptz not null default now()
);

-- Resultados de análisis IA
create table public.analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_id uuid references public.documents(id) on delete set null,
  module text not null check (module in ('housing','receipts','health','insurance')),
  result jsonb not null,
  model text,
  created_at timestamptz not null default now()
);

-- Base de conocimiento legal para RAG (leyes, guías)
create table public.knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  source text not null,          -- ej. 'ley_6_1987', 'ley_93_1973'
  content text not null,
  embedding vector(1536),
  created_at timestamptz not null default now()
);
create index on public.knowledge_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Trigger: crear perfil al registrarse
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end; $$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.documents enable row level security;
alter table public.analyses enable row level security;
alter table public.knowledge_chunks enable row level security;

create policy "own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "own documents" on public.documents
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own analyses" on public.analyses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "knowledge readable" on public.knowledge_chunks
  for select using (auth.role() = 'authenticated');

-- Storage: bucket privado para adjuntos
insert into storage.buckets (id, name, public) values ('documents','documents', false)
on conflict (id) do nothing;
create policy "own files" on storage.objects
  for all using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);

-- Consumo de créditos (atómico)
create or replace function public.consume_credit(p_user_id uuid)
returns boolean language plpgsql security definer as $$
declare ok boolean;
begin
  update public.profiles set credits = credits - 1
  where id = p_user_id and credits > 0
  returning true into ok;
  return coalesce(ok, false);
end; $$;
