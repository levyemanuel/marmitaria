# Marmitaria Sabor de Casa · Cardápio digital

Projeto da disciplina **N695 – Desenvolvimento de Plataformas Web** (Unifor), Grupo 16, cenário 3.

Sistema web para a marmitaria manter o cardápio organizado por categorias: cadastrar, listar, editar e excluir **categorias** e **pratos**.

## Estrutura

| Caminho | Conteúdo |
|---|---|
| `database/schema.sql` | Criação das tabelas, regras e dados de exemplo |
| `.env.example` | Modelo das variáveis de ambiente |
| `.github/workflows/manter-banco-ativo.yml` | Consulta diária para o Supabase não pausar o banco |

## Banco de dados

PostgreSQL 17 hospedado no [Supabase](https://supabase.com) (região São Paulo).

```
categorias (1) ──── (N) pratos
  id                    id
  nome  (único)         nome
  descricao             descricao
                        preco (> 0)
                        categoria_id → categorias.id
```

As regras do cenário também são garantidas pelo próprio banco. Se a API deixar passar um dado inválido, o banco recusa com um código de erro que a API pode traduzir em mensagem para o usuário:

| Regra | Restrição no banco | Código do erro |
|---|---|---|
| Campos obrigatórios | `not null` | `23502` |
| Nome em branco | `categorias_nome_check`, `pratos_nome_check` | `23514` |
| Preço maior que zero | `pratos_preco_check` | `23514` |
| Nome de categoria sem repetição (ignora maiúsculas e espaços) | `categorias_nome_unico` | `23505` |
| Prato precisa de uma categoria existente | `pratos_categoria_id_fkey` | `23503` |
| Não excluir categoria que ainda tem pratos | `pratos_categoria_id_fkey` (`on delete restrict`) | `23503` |

O acesso pela API automática do Supabase está bloqueado (Row Level Security sem políticas). Só a API da equipe, que conecta direto no PostgreSQL, acessa os dados.

### Criar o banco do zero

1. No Supabase, crie um projeto na região **South America (São Paulo)**.
2. Abra o **SQL Editor**, cole o conteúdo de `database/schema.sql` e clique em **Run**.

## Configurar o ambiente local

1. Copie `.env.example` para `.env`.
2. Em `DATABASE_URL`, cole a connection string do banco (**Session pooler**, porta 5432), numa linha só.
3. O `.env` contém a senha do banco e **nunca** vai para o GitHub (já está no `.gitignore`).

Conexão com o pacote [`pg`](https://node-postgres.com):

```js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
```

Não coloque `?sslmode=require` na URL: com o `pg` 8 isso gera o erro `self-signed certificate in certificate chain`.

### Erros comuns de conexão

| Mensagem | Causa | O que fazer |
|---|---|---|
| `tenant/user postgres.… not found` | Projeto pausado no Supabase ou string copiada errada | Avisar o responsável pelo banco; recopiar a string |
| `self-signed certificate in certificate chain` | `sslmode=require` na URL | Tirar da URL e usar `ssl: { rejectUnauthorized: false }` |
| `getaddrinfo ENOTFOUND db.….supabase.co` | Usando a conexão direta, que só funciona em redes com IPv6 | Usar a string do pooler (`….pooler.supabase.com`) |
| `password authentication failed` | Senha errada | Recopiar a string completa |
| `DATABASE_URL` vazio / `undefined` | `.env` não foi carregado | Rodar com `node --env-file=.env` ou usar o pacote `dotenv` |

## Publicação

- **Banco:** Supabase, plano gratuito. O projeto pausa depois de 7 dias sem uso, e a aplicação precisa ficar no ar até 10/12. O workflow `manter-banco-ativo` faz uma consulta por dia; ele usa o segredo `DATABASE_URL`, configurado em *Settings → Secrets and variables → Actions*.
- **Aplicação:** Vercel. Lá, `DATABASE_URL` usa o **Transaction pooler** (porta 6543), indicado para funções serverless.
