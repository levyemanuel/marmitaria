# Marmitaria Sabor de Casa · Cardápio digital

Projeto da disciplina **N695 – Desenvolvimento de Plataformas Web** (Unifor), Grupo 16, cenário 3.

Sistema web para a marmitaria manter o cardápio organizado por categorias: cadastrar, listar, editar e excluir **categorias** e **pratos**.

## Estrutura

| Caminho | Conteúdo |
|---|---|
| `app.py` | Ponto de entrada da API (Flask) |
| `api/` | Rotas HTTP de categorias e pratos |
| `services/` | Validação dos dados recebidos |
| `data/` | Acesso ao banco (consultas SQL e conexão) |
| `database/schema.sql` | Criação das tabelas, regras e dados de exemplo |
| `requirements.txt` | Dependências Python |
| `.env.example` | Modelo das variáveis de ambiente |
| `.github/workflows/manter-banco-ativo.yml` | Consulta diária para o Supabase não pausar o banco |

## Como rodar a API

Com Python 3.10 ou superior, crie o ambiente e o arquivo de configuração no PowerShell.

```powershell
py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

Preencha `DATABASE_URL` no `.env` (veja [Configurar a conexão](#configurar-a-conexão)) e execute a aplicação no mesmo terminal.

```powershell
.\.venv\Scripts\python.exe app.py
```

A porta padrão é `3000`. Se a interface rodar em outra origem, ajuste `CORS_ORIGIN` para o endereço dela.

## Rotas da API

### Categorias

| Método | Rota | Resposta de sucesso |
|---|---|---|
| GET | `/api/categorias` | 200 com a lista de categorias |
| POST | `/api/categorias` | 201 com a categoria cadastrada |
| PUT | `/api/categorias/<id>` | 200 com a categoria atualizada |
| DELETE | `/api/categorias/<id>` | 204 sem corpo |

```json
{
  "nome": "Marmitas",
  "descricao": "Pratos do dia"
}
```

`nome` é obrigatório; `descricao` é opcional. Nome repetido e exclusão de categoria que ainda tem pratos recebem 409.

### Pratos

| Método | Rota | Resposta de sucesso |
|---|---|---|
| GET | `/api/pratos` | 200 com a lista de pratos |
| GET | `/api/pratos?categoria_id=1` | 200 com os pratos dessa categoria |
| POST | `/api/pratos` | 201 com o prato cadastrado |
| PUT | `/api/pratos/<id>` | 200 com o prato atualizado |
| DELETE | `/api/pratos/<id>` | 204 sem corpo |

```json
{
  "nome": "Frango grelhado",
  "descricao": "Com arroz e farofa",
  "preco": "22.90",
  "categoria_id": 1
}
```

`nome`, `preco` e `categoria_id` são obrigatórios. O preço pode ser enviado como número ou texto decimal com ponto. Nas respostas ele vem como texto com duas casas decimais. A descrição é opcional.

### Erros

Dados inválidos recebem 400 com `erro` e, quando aplicável, `campo`. A edição ou exclusão de um registro inexistente recebe 404. Se o banco estiver fora do ar, a API responde 503.

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

As regras do cenário também são garantidas pelo próprio banco. Se algum dado inválido passar pela validação da API, o banco recusa com um código de erro, que a API traduz em mensagem para o usuário:

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

## Configurar a conexão

1. Copie `.env.example` para `.env`, na raiz do projeto.
2. Em `DATABASE_URL`, cole a connection string do banco (**Session pooler**, porta 5432), numa linha só.
3. O `.env` contém a senha do banco e **nunca** vai para o GitHub (já está no `.gitignore`).

O `app.py` carrega o `.env` com o `python-dotenv`, e `data/conexao.py` abre a conexão com o `psycopg`.

### Erros comuns de conexão

| Sintoma | Causa | O que fazer |
|---|---|---|
| `Configure a variável DATABASE_URL.` | `.env` ausente ou fora da raiz do projeto | Criar o `.env` a partir do `.env.example`, ao lado do `app.py` |
| API responde 503 `Banco de dados indisponível.` | Banco pausado no Supabase ou string errada | Avisar o responsável pelo banco; recopiar a string |
| `tenant/user postgres.… not found` | Projeto pausado no Supabase ou string copiada errada | Avisar o responsável pelo banco; recopiar a string |
| `could not translate host name "db.….supabase.co"` | Usando a conexão direta, que só funciona em redes com IPv6 | Usar a string do pooler (`….pooler.supabase.com`) |
| `password authentication failed` | Senha errada | Recopiar a string completa |

## Publicação

- **Banco:** Supabase, plano gratuito. O projeto pausa depois de 7 dias sem uso, e a aplicação precisa ficar no ar até 10/12. O workflow `manter-banco-ativo` faz uma consulta por dia; ele usa o segredo `DATABASE_URL`, configurado em *Settings → Secrets and variables → Actions*.
- **Aplicação:** Vercel. Lá, `DATABASE_URL` usa o **Transaction pooler** (porta 6543), indicado para funções serverless.
