/* ==========================================================================
   Sabor Caseiro — layout.js
   Monta o cabeçalho (com menu) e o rodapé em todas as telas, para que o
   HTML deles não fique duplicado em cada página.

   Como usar em uma página:
     <body data-pagina="categorias">
       <div id="cabecalho"></div>
       <main class="principal"> ... </main>
       <div id="rodape"></div>
       <script src="js/layout.js"></script>
     </body>

   O valor de data-pagina deve ser um dos "id" de ITENS_MENU para que o
   link correspondente fique destacado.
   ========================================================================== */

const NOME_MARMITARIA = "Sabor Caseiro";

const ITENS_MENU = [
  { id: "inicio", rotulo: "Início", href: "index.html" },
  { id: "categorias", rotulo: "Categorias", href: "categorias.html" },
  { id: "pratos", rotulo: "Pratos", href: "pratos.html" },
];

function criarLinkMenu(item, paginaAtual) {
  const ativo = item.id === paginaAtual;
  const atributoAtivo = ativo ? ' aria-current="page"' : "";
  return `
    <li>
      <a class="menu__link" href="${item.href}"${atributoAtivo}>${item.rotulo}</a>
    </li>`;
}

function criarCabecalho(paginaAtual) {
  const links = ITENS_MENU.map((item) => criarLinkMenu(item, paginaAtual)).join("");
  return `
    <header class="cabecalho">
      <div class="container cabecalho__conteudo">
        <a class="logo" href="index.html" aria-label="${NOME_MARMITARIA} — página inicial">
          <img class="logo__icone" src="img/logo.svg" alt="" />
          <span>Sabor <span class="logo__destaque">Caseiro</span></span>
        </a>

        <button class="menu__botao" type="button" aria-label="Abrir menu"
                aria-expanded="false" aria-controls="menu-principal">
          <span class="menu__botao-linha"></span>
          <span class="menu__botao-linha"></span>
          <span class="menu__botao-linha"></span>
        </button>

        <nav class="menu" id="menu-principal" aria-label="Menu principal">
          <ul class="menu__lista">${links}</ul>
        </nav>
      </div>
    </header>`;
}

function criarRodape() {
  const ano = new Date().getFullYear();
  return `
    <footer class="rodape">
      <div class="container">
        <div class="rodape__conteudo">
          <div>
            <p class="rodape__titulo">${NOME_MARMITARIA}</p>
            <p>Comida feita com carinho, do jeitinho de casa.
               Cardápio sempre atualizado.</p>
          </div>
          <div>
            <p class="rodape__titulo">Navegação</p>
            <ul class="rodape__lista">
              ${ITENS_MENU.map((item) => `<li><a href="${item.href}">${item.rotulo}</a></li>`).join("")}
            </ul>
          </div>
          <div>
            <p class="rodape__titulo">Atendimento</p>
            <p>Segunda a sábado, das 10h às 15h<br />Pedidos por mensagem</p>
          </div>
        </div>
        <p class="rodape__copyright">
          © ${ano} ${NOME_MARMITARIA} · Trabalho de N695 — Desenvolvimento de Plataformas Web (Unifor)
        </p>
      </div>
    </footer>`;
}

function alternarMenu(botao, menu) {
  const aberto = botao.getAttribute("aria-expanded") === "true";
  botao.setAttribute("aria-expanded", String(!aberto));
  botao.setAttribute("aria-label", aberto ? "Abrir menu" : "Fechar menu");
  menu.classList.toggle("menu--aberto", !aberto);
}

function ativarMenuResponsivo() {
  const botao = document.querySelector(".menu__botao");
  const menu = document.getElementById("menu-principal");
  if (!botao || !menu) return;

  botao.addEventListener("click", () => alternarMenu(botao, menu));

  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && menu.classList.contains("menu--aberto")) {
      alternarMenu(botao, menu);
      botao.focus();
    }
  });
}

function montarLayout() {
  const paginaAtual = document.body.dataset.pagina;
  const areaCabecalho = document.getElementById("cabecalho");
  const areaRodape = document.getElementById("rodape");

  if (areaCabecalho) areaCabecalho.outerHTML = criarCabecalho(paginaAtual);
  if (areaRodape) areaRodape.outerHTML = criarRodape();

  ativarMenuResponsivo();
}

document.addEventListener("DOMContentLoaded", montarLayout);
