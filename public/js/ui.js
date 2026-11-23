/* ==========================================================================
   Sabor Caseiro — ui.js
   Funções visuais compartilhadas pelas telas de categorias e de pratos.
   Não fazem chamadas à API: apenas exibem mensagens, confirmações e
   formatam valores. Todas ficam no objeto global "SaborCaseiro".

   Exemplos:
     SaborCaseiro.notificar("Categoria salva com sucesso!", "sucesso");
     SaborCaseiro.notificar("Não foi possível excluir.", "erro");

     const confirmou = await SaborCaseiro.confirmar("Excluir esta categoria?");
     if (confirmou) { ... }

     SaborCaseiro.formatarPreco(18.5);              // "R$ 18,50"
     SaborCaseiro.mostrarErroCampo("nome", "Informe o nome.");
     SaborCaseiro.limparErrosFormulario(formulario);
   ========================================================================== */

const SaborCaseiro = (() => {
  const TEMPO_NOTIFICACAO_MS = 4000;
  const ICONES = { sucesso: "✔", erro: "✖", aviso: "!", info: "i" };

  function obterAreaNotificacoes() {
    let area = document.querySelector(".notificacoes");
    if (!area) {
      area = document.createElement("div");
      area.className = "notificacoes";
      area.setAttribute("aria-live", "polite");
      document.body.appendChild(area);
    }
    return area;
  }

  function notificar(mensagem, tipo = "info") {
    const alerta = document.createElement("div");
    alerta.className = `alerta alerta--${tipo}`;
    alerta.setAttribute("role", tipo === "erro" ? "alert" : "status");
    alerta.innerHTML = `
      <span aria-hidden="true">${ICONES[tipo] || ""}</span>
      <span></span>
      <button class="alerta__fechar" type="button" aria-label="Fechar">×</button>`;
    alerta.children[1].textContent = mensagem;
    alerta.querySelector(".alerta__fechar").addEventListener("click", () => alerta.remove());

    obterAreaNotificacoes().appendChild(alerta);
    setTimeout(() => alerta.remove(), TEMPO_NOTIFICACAO_MS);
  }

  function criarModalConfirmacao() {
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "modal-titulo");
    modal.innerHTML = `
      <div class="modal__caixa">
        <h3 id="modal-titulo">Confirmar ação</h3>
        <p class="modal__mensagem"></p>
        <div class="modal__acoes">
          <button class="botao botao--secundario" type="button" data-resposta="nao">Cancelar</button>
          <button class="botao botao--perigo" type="button" data-resposta="sim">Confirmar</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    return modal;
  }

  function confirmar(mensagem, textoConfirmar = "Confirmar") {
    const modal = document.querySelector(".modal") || criarModalConfirmacao();
    modal.querySelector(".modal__mensagem").textContent = mensagem;
    modal.querySelector('[data-resposta="sim"]').textContent = textoConfirmar;
    modal.classList.add("modal--aberto");
    modal.querySelector('[data-resposta="nao"]').focus();

    return new Promise((resolver) => {
      function responder(resposta) {
        modal.classList.remove("modal--aberto");
        modal.removeEventListener("click", aoClicar);
        document.removeEventListener("keydown", aoTeclar);
        resolver(resposta);
      }
      function aoClicar(evento) {
        if (evento.target === modal) return responder(false);
        const botao = evento.target.closest("[data-resposta]");
        if (botao) responder(botao.dataset.resposta === "sim");
      }
      function aoTeclar(evento) {
        if (evento.key === "Escape") responder(false);
      }
      modal.addEventListener("click", aoClicar);
      document.addEventListener("keydown", aoTeclar);
    });
  }

  function formatarPreco(valor) {
    return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function mostrarErroCampo(idCampo, mensagem) {
    const entrada = document.getElementById(idCampo);
    if (!entrada) return;
    const campo = entrada.closest(".campo");
    const areaErro = campo.querySelector(".campo__erro");
    campo.classList.add("campo--invalido");
    entrada.setAttribute("aria-invalid", "true");
    if (areaErro) areaErro.textContent = mensagem;
  }

  function limparErrosFormulario(formulario) {
    formulario.querySelectorAll(".campo--invalido").forEach((campo) => {
      campo.classList.remove("campo--invalido");
      campo.querySelector(".campo__entrada")?.removeAttribute("aria-invalid");
    });
  }

  return { notificar, confirmar, formatarPreco, mostrarErroCampo, limparErrosFormulario };
})();
