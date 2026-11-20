/* José — telas de listagem, cadastro, edição e exclusão de categorias.
   A comunicação e o tratamento visual compartilhados estão em api.js. */
(() => {
  "use strict";

  const porId = (id) => document.getElementById(id);
  const tela = document.body.dataset.tela;
  const api = JoseAPI;
  let carregando = false;

  function linkAcao(texto, destino, nome) {
    const link = api.elemento("a", "botao botao--secundario botao--pequeno", texto);
    link.href = destino;
    link.setAttribute("aria-label", `${texto}: ${nome}`);
    return link;
  }

  function criarLinha(categoria) {
    const linha = document.createElement("tr");
    const nome = api.elemento("td", "tabela__nome", categoria.nome);
    const descricao = api.elemento("td", "texto-suave tabela__descricao", categoria.descricao || "Sem descrição");
    const acoes = document.createElement("td");
    const grupo = api.elemento("div", "acoes-linha");
    const id = encodeURIComponent(String(categoria.id));
    grupo.append(
      linkAcao("Ver pratos", `pratos.html?categoria=${id}`, categoria.nome),
      linkAcao("Editar", `categoria-formulario.html?id=${id}`, categoria.nome),
    );
    const excluir = api.elemento("button", "botao botao--perigo botao--pequeno", "Excluir");
    excluir.type = "button";
    excluir.setAttribute("aria-label", `Excluir categoria: ${categoria.nome}`);
    excluir.addEventListener("click", () => excluirCategoria(categoria, excluir));
    grupo.appendChild(excluir);
    acoes.appendChild(grupo);
    linha.append(nome, descricao, acoes);
    return linha;
  }

  async function listarCategorias() {
    if (carregando) return;
    carregando = true;
    porId("carregando").hidden = false;
    porId("conteudo").hidden = true;
    porId("estado-vazio").hidden = true;
    porId("tentar-novamente").hidden = true;
    try {
      const categorias = await api.requisitar("/categorias");
      if (!Array.isArray(categorias)) throw new Error("A API retornou uma lista de categorias inválida.");
      const fragmento = document.createDocumentFragment();
      categorias.forEach((categoria) => fragmento.appendChild(criarLinha(categoria)));
      porId("lista-categorias").replaceChildren(fragmento);
      const total = categorias.length;
      porId("resumo-categorias").textContent = `${total} ${total === 1 ? "categoria cadastrada" : "categorias cadastradas"}`;
      porId("conteudo").hidden = total === 0;
      porId("estado-vazio").hidden = total !== 0;
    } catch (erro) {
      api.exibirErro(erro);
      porId("tentar-novamente").hidden = false;
    } finally {
      carregando = false;
      porId("carregando").hidden = true;
    }
  }

  async function excluirCategoria(categoria, botao) {
    if (botao.dataset.excluindo === "true") return;
    botao.dataset.excluindo = "true";
    try {
      if (!await api.confirmar(`Excluir a categoria “${categoria.nome}”? Esta ação não pode ser desfeita.`)) return;
      botao.disabled = true;
      api.limparMensagem();
      await api.requisitar(`/categorias/${encodeURIComponent(String(categoria.id))}`, { method: "DELETE" });
      api.mensagem("Categoria excluída com sucesso.", "sucesso");
      await listarCategorias();
      porId("titulo-lista").focus();
    } catch (erro) {
      api.exibirErro(erro);
    } finally {
      botao.disabled = false;
      delete botao.dataset.excluindo;
    }
  }

  function iniciarLista() {
    api.mostrarSucesso();
    porId("tentar-novamente").addEventListener("click", () => {
      api.limparMensagem();
      listarCategorias();
    });
    listarCategorias();
  }

  function iniciarFormulario() {
    const formulario = porId("formulario");
    const parametros = new URLSearchParams(window.location.search);
    const temId = parametros.has("id");
    const id = parametros.get("id");
    let pronto = false;
    let salvando = false;

    async function carregarCategoria() {
      if (carregando) return;
      pronto = false;
      carregando = true;
      formulario.hidden = true;
      porId("carregando").hidden = false;
      porId("tentar-novamente").hidden = true;
      try {
        if (temId) {
          if (!api.idValido(id)) throw new Error("O identificador da categoria é inválido. Volte à lista e escolha uma categoria.");
          const categoria = await api.requisitar(`/categorias/${encodeURIComponent(id)}`);
          porId("nome").value = categoria.nome;
          porId("descricao").value = categoria.descricao || "";
        }
        formulario.hidden = false;
        pronto = true;
      } catch (erro) {
        api.exibirErro(erro);
        porId("tentar-novamente").hidden = !api.idValido(id);
      } finally {
        carregando = false;
        porId("carregando").hidden = true;
      }
    }

    if (temId) {
      document.title = "Editar categoria — Sabor Caseiro";
      porId("titulo-formulario").textContent = "Editar categoria";
      porId("trilha-formulario").textContent = "Editar categoria";
    }

    porId("tentar-novamente").addEventListener("click", () => {
      api.limparMensagem();
      carregarCategoria();
    });

    formulario.addEventListener("submit", async (evento) => {
      evento.preventDefault();
      if (!pronto || salvando) return;
      api.limparMensagem();
      SaborCaseiro.limparErrosFormulario(formulario);
      if (!api.validarTexto(formulario)) return;
      const dados = {
        nome: porId("nome").value.trim(),
        descricao: porId("descricao").value.trim() || null,
      };
      salvando = true;
      api.pendente(formulario, true);
      let erroAoSalvar;
      try {
        await api.requisitar(temId ? `/categorias/${encodeURIComponent(id)}` : "/categorias", {
          method: temId ? "PUT" : "POST",
          body: dados,
        });
        api.lembrarSucesso(temId ? "Categoria atualizada com sucesso." : "Categoria cadastrada com sucesso.");
        window.location.assign("categorias.html");
      } catch (erro) {
        erroAoSalvar = erro;
      } finally {
        salvando = false;
        api.pendente(formulario, false);
      }
      if (erroAoSalvar) api.exibirErro(erroAoSalvar, formulario);
    });
    carregarCategoria();
  }

  if (tela === "categorias-lista") iniciarLista();
  if (tela === "categoria-formulario") iniciarFormulario();
})();
