/* José — comunicação e comportamentos comuns das telas de categorias e pratos. */
const JoseAPI = (() => {
  const controlesAnteriores = new WeakMap();
  let confirmacaoEmAndamento = false;

  class ErroAPI extends Error {
    constructor(mensagem, status = 0, campo = null) {
      super(mensagem);
      this.name = "ErroAPI";
      this.status = status;
      this.campo = campo;
    }
  }

  async function requisitar(caminho, opcoes = {}) {
    const controlador = new AbortController();
    const aoAbortar = () => controlador.abort();
    if (opcoes.signal?.aborted) controlador.abort();
    opcoes.signal?.addEventListener("abort", aoAbortar, { once: true });
    const temporizador = setTimeout(() => controlador.abort(), 15000);
    try {
      const resposta = await fetch(`/api${caminho}`, {
        method: opcoes.method || "GET",
        headers: { Accept: "application/json", ...(opcoes.body !== undefined ? { "Content-Type": "application/json" } : {}) },
        body: opcoes.body !== undefined ? JSON.stringify(opcoes.body) : undefined,
        signal: controlador.signal,
        cache: "no-store",
      });
      if (resposta.status === 204) return null;
      let dados;
      try {
        dados = await resposta.json();
      } catch {
        throw new ErroAPI("A API retornou uma resposta inválida. Tente novamente.", resposta.status);
      }
      if (!resposta.ok) {
        throw new ErroAPI(
          typeof dados?.erro === "string" ? dados.erro : "Não foi possível concluir a operação. Tente novamente.",
          resposta.status,
          typeof dados?.campo === "string" ? dados.campo : null,
        );
      }
      return dados;
    } catch (erro) {
      if (opcoes.signal?.aborted) throw erro;
      if (erro instanceof ErroAPI) throw erro;
      throw new ErroAPI(erro.name === "AbortError"
        ? "A API demorou para responder. Verifique a conexão e tente novamente."
        : "Não foi possível acessar a API. Verifique a conexão e tente novamente.");
    } finally {
      clearTimeout(temporizador);
      opcoes.signal?.removeEventListener("abort", aoAbortar);
    }
  }

  function elemento(tag, classe = "", texto) {
    const novo = document.createElement(tag);
    if (classe) novo.className = classe;
    if (texto !== undefined && texto !== null) novo.textContent = texto;
    return novo;
  }

  function mensagem(texto, tipo = "erro") {
    const area = document.getElementById("mensagem");
    if (!area) return;
    area.className = `alerta alerta--${tipo}`;
    area.setAttribute("role", tipo === "erro" ? "alert" : "status");
    area.textContent = texto;
    area.hidden = false;
  }

  function limparMensagem() {
    const area = document.getElementById("mensagem");
    if (area) {
      area.hidden = true;
      area.textContent = "";
    }
  }

  function exibirErro(erro, formulario) {
    mensagem(erro.message || "Não foi possível concluir a operação.");
    const campo = typeof erro.campo === "string" ? document.getElementById(erro.campo) : null;
    if (formulario && campo && formulario.contains(campo)) {
      SaborCaseiro.mostrarErroCampo(campo.id, erro.message);
      campo.focus();
    }
  }

  function pendente(formulario, ocupado) {
    formulario.setAttribute("aria-busy", String(ocupado));
    const botao = formulario.querySelector('[type="submit"]');
    if (ocupado) {
      controlesAnteriores.set(formulario, [...formulario.querySelectorAll("input, textarea, select, button")]
        .map((controle) => [controle, controle.disabled]));
      controlesAnteriores.get(formulario).forEach(([controle]) => { controle.disabled = true; });
      if (botao) { botao.dataset.rotuloAnterior = botao.textContent; botao.textContent = "Salvando…"; }
    } else {
      controlesAnteriores.get(formulario)?.forEach(([controle, desabilitado]) => { controle.disabled = desabilitado; });
      controlesAnteriores.delete(formulario);
      if (botao?.dataset.rotuloAnterior) botao.textContent = botao.dataset.rotuloAnterior;
    }
  }

  function lembrarSucesso(texto) {
    try { sessionStorage.setItem("jose:sucesso", texto); } catch { /* Navegação continua com armazenamento desativado. */ }
  }

  function mostrarSucesso() {
    try {
      const texto = sessionStorage.getItem("jose:sucesso");
      if (texto) mensagem(texto, "sucesso");
      sessionStorage.removeItem("jose:sucesso");
    } catch { /* Mensagens da API continuam disponíveis sem sessionStorage. */ }
  }

  async function confirmar(texto) {
    if (confirmacaoEmAndamento) return false;
    confirmacaoEmAndamento = true;
    const focoAnterior = document.activeElement;
    const resposta = SaborCaseiro.confirmar(texto, "Excluir");
    const modal = document.querySelector(".modal");
    const conteudo = [...document.querySelectorAll("header, main, footer")];
    const inertAnterior = conteudo.map((item) => item.inert);
    conteudo.forEach((item) => { item.inert = true; });
    function manterFoco(evento) {
      if (evento.key !== "Tab") return;
      const botoes = [...modal.querySelectorAll("button")];
      const primeiro = botoes[0];
      const ultimo = botoes[botoes.length - 1];
      if (evento.shiftKey && document.activeElement === primeiro) { evento.preventDefault(); ultimo.focus(); }
      else if (!evento.shiftKey && document.activeElement === ultimo) { evento.preventDefault(); primeiro.focus(); }
    }
    document.addEventListener("keydown", manterFoco);
    try {
      return await resposta;
    } finally {
      document.removeEventListener("keydown", manterFoco);
      conteudo.forEach((item, indice) => { item.inert = inertAnterior[indice]; });
      if (focoAnterior?.isConnected && !focoAnterior.disabled) focoAnterior.focus();
      confirmacaoEmAndamento = false;
    }
  }

  function validarTexto(formulario) {
    SaborCaseiro.limparErrosFormulario(formulario);
    limparMensagem();
    const nome = formulario.querySelector('[name="nome"]');
    const descricao = formulario.querySelector('[name="descricao"]');
    if (!nome.value.trim()) {
      exibirErro(new ErroAPI("Informe o nome.", 400, "nome"), formulario);
      return false;
    }
    if (nome.value.trim().length > 100) {
      exibirErro(new ErroAPI("Use até 100 caracteres no nome.", 400, "nome"), formulario);
      return false;
    }
    if (descricao && descricao.value.trim().length > 255) {
      exibirErro(new ErroAPI("Use até 255 caracteres na descrição.", 400, "descricao"), formulario);
      return false;
    }
    return true;
  }

  function idValido(valor) {
    return typeof valor === "string" && /^[1-9]\d{0,18}$/.test(valor) && BigInt(valor) <= 9223372036854775807n;
  }

  return { requisitar, elemento, mensagem, limparMensagem, exibirErro, pendente,
    lembrarSucesso, mostrarSucesso, confirmar, validarTexto, idValido, ErroAPI };
})();
