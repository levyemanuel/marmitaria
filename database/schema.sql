-- N695 · Cenário 3 · Marmitaria Sabor de Casa
-- Estrutura do banco (PostgreSQL / Supabase)

create table categorias (
  id        bigint generated always as identity primary key,
  nome      varchar(100) not null check (btrim(nome) <> ''),
  descricao varchar(255)
);

-- Nome de categoria sem repetição (ignora maiúsculas/minúsculas e espaços nas pontas)
create unique index categorias_nome_unico on categorias (lower(btrim(nome)));

create table pratos (
  id           bigint generated always as identity primary key,
  nome         varchar(100)  not null check (btrim(nome) <> ''),
  descricao    varchar(255),
  preco        numeric(10,2) not null check (preco > 0),
  categoria_id bigint        not null references categorias(id) on delete restrict
);

-- Acelera a listagem de pratos por categoria
create index pratos_categoria_id_idx on pratos (categoria_id);

-- Bloqueia o acesso pela API automática do Supabase.
-- A API da equipe conecta direto no Postgres e não é afetada.
alter table categorias enable row level security;
alter table pratos     enable row level security;

-- Dados de exemplo
insert into categorias (nome, descricao) values
  ('Marmitas', 'Pratos do dia com arroz, feijão e acompanhamento'),
  ('Saladas',  'Opções leves'),
  ('Bebidas',  'Sucos e refrigerantes');

insert into pratos (nome, descricao, preco, categoria_id) values
  ('Frango grelhado',        'Com arroz, feijão e farofa',          22.90, 1),
  ('Carne de panela',        'Com purê e arroz',                    26.90, 1),
  ('Salada Caesar',          'Alface, frango, croutons e parmesão', 19.90, 2),
  ('Suco de laranja 500 ml', null,                                   8.00, 3);
