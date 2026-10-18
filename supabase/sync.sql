-- ════════════════════════════════════════════════════════════════════
-- 🏠 SERVIDOR DEL HOGAR SINCRONIZADO · proyecto Supabase "mi-finanzas-sync"
-- ────────────────────────────────────────────────────────────────────
-- Copia de referencia de lo que ya está creado en el servidor (no hay que volver a ejecutarlo).
-- El servidor SOLO guarda "cajas cerradas": texto cifrado en el celular (AES-256-GCM)
-- con una llave que nunca sale de los celulares del hogar.
-- No hay usuarios, nombres, correos ni teléfonos. "room" es un número aleatorio.
-- Las tablas viven en el esquema "relay", que NO está publicado: solo se accede
-- por las tres funciones de abajo.
-- ════════════════════════════════════════════════════════════════════

create schema if not exists relay;

create table if not exists relay.rooms (
  room text primary key check (room ~ '^[0-9a-f]{64}$'),
  last_seen timestamptz not null default now()
);
create index if not exists rooms_last_seen on relay.rooms(last_seen);

create table if not exists relay.boxes (
  room text not null references relay.rooms(room) on delete cascade,
  k text not null check (char_length(k) between 1 and 80),      -- nombre opaco de la caja
  box text not null check (char_length(box) <= 60000),           -- contenido cifrado
  seq bigint not null,
  primary key (room, k)
);
create index if not exists boxes_room_seq on relay.boxes(room, seq);
create sequence if not exists relay.seq_gen;
alter table relay.rooms enable row level security;
alter table relay.boxes enable row level security;

-- Limpieza: hogares sin uso en 60 días se borran solos (se llama en cada envío).
create or replace function relay.sync_cleanup()
returns void language plpgsql security definer set search_path = '' as $$
begin
  delete from relay.rooms where last_seen < now() - interval '60 days';
end $$;

-- Guarda o reemplaza cajas cifradas.
create or replace function public.sync_push(p_room text, p_items jsonb)
returns bigint language plpgsql security definer set search_path = '' as $$
declare v_seq bigint := 0; it jsonb; v_count int;
begin
  if p_room !~ '^[0-9a-f]{64}$' then raise exception 'room inválido'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) > 300 then raise exception 'lote inválido'; end if;
  insert into relay.rooms(room) values (p_room) on conflict (room) do update set last_seen = now();
  select count(*) into v_count from relay.boxes where room = p_room;
  if v_count > 6000 then raise exception 'hogar lleno'; end if;
  for it in select * from jsonb_array_elements(p_items) loop
    v_seq := nextval('relay.seq_gen');
    insert into relay.boxes(room, k, box, seq) values (p_room, it->>'k', it->>'box', v_seq)
    on conflict (room, k) do update set box = excluded.box, seq = excluded.seq;
  end loop;
  perform relay.sync_cleanup();
  return v_seq;
end $$;

-- Entrega las cajas que cambiaron.
create or replace function public.sync_pull(p_room text, p_since bigint)
returns table(k text, box text, seq bigint) language plpgsql security definer set search_path = '' as $$
begin
  if p_room !~ '^[0-9a-f]{64}$' then raise exception 'room inválido'; end if;
  update relay.rooms set last_seen = now() where room = p_room;
  return query select b.k, b.box, b.seq from relay.boxes b where b.room = p_room and b.seq > coalesce(p_since, 0) order by b.seq limit 1000;
end $$;

-- Borra el hogar completo (botón "Borrar del servidor").
create or replace function public.sync_delete_room(p_room text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  delete from relay.rooms where room = p_room;
end $$;

grant execute on function public.sync_push(text, jsonb) to anon;
grant execute on function public.sync_pull(text, bigint) to anon;
grant execute on function public.sync_delete_room(text) to anon;

-- ════════════════════════════════════════════════════════════════════
-- 📊 ESTADÍSTICAS ANÓNIMAS (v1.8) · solo sumas por día, sin identificadores
-- ════════════════════════════════════════════════════════════════════
create table if not exists relay.stats_daily (
  day date not null,
  kind text not null check (kind in ('first_open','install','active')),
  ref text not null default '' check (ref ~ '^([a-z0-9]{8})?$'),     -- código del enlace compartido
  platform text not null check (platform in ('android','ios','desktop','otro')),
  mode text not null check (mode in ('app','web')),
  n integer not null default 0,
  primary key (day, kind, ref, platform, mode)
);
alter table relay.stats_daily enable row level security;

-- Clave de administradora: solo se guarda su huella SHA-256 (la clave nunca está en el servidor).
create table if not exists relay.admin_key (id int primary key default 1 check (id = 1), key_hash text not null);
alter table relay.admin_key enable row level security;
-- insert into relay.admin_key(id, key_hash) values (1, '<sha256 de la clave>');   ← ya configurado

alter table relay.rooms add column if not exists created_at timestamptz not null default now();

-- Funciones: public.stats_ping(kind, ref, platform, mode) suma +1;
-- public.stats_report(clave) devuelve el resumen (espera 1,5 s si la clave es incorrecta).
-- public.sync_push limita a 300 hogares nuevos por hora y cajas de máx. 60.000 caracteres.
