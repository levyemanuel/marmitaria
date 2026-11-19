# marmitaria
Projeto Marmitaria - Atividade Unifor, cadeira N695 - Desenv plataformas web. (Grupo 16)

## API de pratos

A API usa as tabelas de `database/schema.sql`. Para criar um banco de desenvolvimento vazio, execute esse arquivo no PostgreSQL.

Com Python 3.10 ou superior, crie o ambiente e o arquivo de configuração no PowerShell.

```powershell
py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

Preencha `DATABASE_URL` no `.env` com o acesso de desenvolvimento ao Supabase. O `.env` fica fora do Git. Execute a aplicação no mesmo terminal.

```powershell
.\.venv\Scripts\python.exe app.py
```

A porta padrão é `3000`. Se a interface rodar em outra origem, ajuste `CORS_ORIGIN` para o endereço dela.

| Método | Rota | Resposta de sucesso |
|---|---|---|
| GET | `/api/pratos` | 200 com a lista de pratos |
| GET | `/api/pratos?categoria_id=1` | 200 com os pratos dessa categoria |
| POST | `/api/pratos` | 201 com o prato cadastrado |
| PUT | `/api/pratos/<id>` | 200 com o prato atualizado |
| DELETE | `/api/pratos/<id>` | 204 sem corpo |

O cadastro e a edição recebem um objeto JSON.

```json
{
  "nome": "Frango grelhado",
  "descricao": "Com arroz e farofa",
  "preco": "22.90",
  "categoria_id": 1
}
```

`nome`, `preco` e `categoria_id` são obrigatórios. O preço pode ser enviado como número ou texto decimal com ponto. Nas respostas ele vem como texto com duas casas decimais. A descrição é opcional.

Dados inválidos recebem 400 com `erro` e, quando aplicável, `campo`. A edição ou exclusão de um prato inexistente recebe 404.
