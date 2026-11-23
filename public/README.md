# Sabor Caseiro — Frontend (layout, menu e estilos compartilhados)

Parte visual base do cardápio digital da marmitaria **Sabor Caseiro**
(N695 — Desenvolvimento de Plataformas Web, Cenário 3).

Branch: `layout-navegacao` · Responsável: Gládson

## Estrutura

```
public/
├── index.html            # Página inicial (já usa o layout)
├── modelo-pagina.html    # Modelo para criar novas telas — copie este arquivo
├── guia-de-estilos.html  # Vitrine de todos os componentes (botões, tabela, formulário...)
├── css/
│   ├── base.css          # Variáveis (cores, fontes, espaçamentos), reset e tipografia
│   ├── layout.css        # Cabeçalho, menu, trilha (breadcrumb), conteúdo e rodapé
│   └── componentes.css   # Botões, cartões, tabelas, formulários, alertas, modal...
├── js/
│   ├── layout.js         # Monta cabeçalho/menu/rodapé e o menu responsivo
│   └── ui.js             # Funções visuais: notificar, confirmar, formatarPreco, erros de campo
└── img/
    └── logo.svg
```

## Como criar uma tela (Roger — categorias, José — pratos)

1. Copie `modelo-pagina.html` para `categorias.html` ou `pratos.html`.
2. Ajuste o `<title>` e o atributo `data-pagina` do `<body>`
   (`categorias` ou `pratos`) para o link do menu ficar destacado.
3. Monte o conteúdo usando as classes do `guia-de-estilos.html`.
4. Inclua o script da sua tela **depois** de `js/layout.js` e `js/ui.js`.

O menu aponta para `index.html`, `categorias.html` e `pratos.html`.
Para listar os pratos de uma categoria, sugestão: `pratos.html?categoria=ID`.

## Funções de `ui.js`

| Função | Uso |
| --- | --- |
| `SaborCaseiro.notificar(msg, tipo)` | Mensagem temporária. `tipo`: `sucesso`, `erro`, `aviso`, `info` |
| `await SaborCaseiro.confirmar(msg, textoBotao)` | Modal de confirmação; retorna `true`/`false` |
| `SaborCaseiro.formatarPreco(valor)` | `18.5` → `R$ 18,50` |
| `SaborCaseiro.mostrarErroCampo(id, msg)` | Destaca o campo e mostra a mensagem de erro |
| `SaborCaseiro.limparErrosFormulario(form)` | Remove os erros exibidos no formulário |

## Onde as telas são publicadas

As telas ficam na pasta `public/`, que a Vercel publica como arquivos
estáticos no mesmo endereço da API: https://marmitaria-orpin.vercel.app.
Por isso os scripts chamam a API por caminhos relativos (`/api/categorias`,
`/api/pratos`), sem domínio e sem configurar CORS.

Cada pull request incorporado na `main` é publicado em cerca de 1 minuto.

Para conferir só o visual no computador, sem a API:

```bash
cd public
python -m http.server 8000
```

Abra http://localhost:8000. As listas vão mostrar erro de conexão, porque
nesse modo a API não está no mesmo endereço das telas.
