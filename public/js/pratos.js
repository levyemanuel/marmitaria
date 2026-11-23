/* José — listagem por categoria e cadastro/edição dos pratos. */
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const parametros = new URLSearchParams(location.search);
  const criar = JoseAPI.elemento;
  const caminhoLista = (categoria = "") => `pratos.html${categoria ? `?categoria=${encodeURIComponent(categoria)}` : ""}`;
  const caminhoFormulario = (categoria = "", id = "") => {
    const consulta = new URLSearchParams();
    if (id) consulta.set("id", id);
    if (categoria) consulta.set("categoria", categoria);
    return `prato-formulario.html${consulta.size ? `?${consulta}` : ""}`;
  };

  function opcoesCategorias(select, categorias, primeiroTexto) {
    select.replaceChildren(criar("option", "", primeiroTexto));
    select.firstChild.value = "";
    categorias.forEach((categoria) => {
      const opcao = criar("option", "", categoria.nome);
      opcao.value = String(categoria.id);
      select.appendChild(opcao);
    });
  }

  async function iniciarLista() {
    const filtro = $("filtro-categoria");
    let categorias = [];
    let categoriasCarregadas = false;
    let controlador = null;
    let versao = 0;
    let categoriaAtual = parametros.get("categoria") || "";

    function atualizarLinks() {
      const destino = caminhoFormulario(categoriaAtual);
      $("novo-prato").href = destino;
      $("acao-vazio").href = categorias.length ? destino : "categoria-formulario.html";
      $("acao-vazio").textContent = categorias.length ? "Cadastrar prato" : "Cadastrar primeira categoria";
    }

    function criarCartao(prato) {
      const cartao = criar("article", "cartao cartao-prato");
      cartao.dataset.pratoId = String(prato.id);
      const titulo = criar("h3", "cartao__titulo", prato.nome);
      const descricao = criar("p", "texto-suave", prato.descricao || "Sem descrição.");
      const preco = criar("p", "preco", SaborCaseiro.formatarPreco(prato.preco));
      const acoes = criar("div", "cartao__rodape");
      const editar = criar("a", "botao botao--secundario botao--pequeno", "Editar");
      editar.href = caminhoFormulario(categoriaAtual, String(prato.id));
      editar.setAttribute("aria-label", `Editar ${prato.nome}`);
      const excluir = criar("button", "botao botao--perigo botao--pequeno", "Excluir");
      excluir.type = "button";
      excluir.setAttribute("aria-label", `Excluir ${prato.nome}`);
      let excluindo = false;
      excluir.addEventListener("click", async () => {
        if (excluindo) return;
        excluindo = true;
        try {
          if (!await JoseAPI.confirmar(`Excluir o prato “${prato.nome}”? Esta ação não pode ser desfeita.`)) return;
          excluir.disabled = true;
          await JoseAPI.requisitar(`/pratos/${encodeURIComponent(prato.id)}`, { method: "DELETE" });
          JoseAPI.mensagem("Prato excluído com sucesso.", "sucesso");
          await carregarPratos(false);
          $("titulo-lista").focus();
        } catch (erro) {
          JoseAPI.exibirErro(erro);
        } finally {
          excluindo = false;
          excluir.disabled = false;
        }
      });
      acoes.append(editar, excluir);
      cartao.append(titulo, descricao, preco, acoes);
      return cartao;
    }

    function renderizar(pratos) {
      const lista = $("lista-pratos");
      lista.replaceChildren();
      const grupos = new Map();
      pratos.forEach((prato) => {
        const chave = String(prato.categoria_id);
        if (!grupos.has(chave)) grupos.set(chave, []);
        grupos.get(chave).push(prato);
      });
      categorias.forEach((categoria) => {
        const itens = grupos.get(String(categoria.id));
        if (!itens) return;
        const secao = criar("section", "grupo-pratos");
        const titulo = criar("h2", "grupo-pratos__titulo", categoria.nome);
        titulo.id = `categoria-${categoria.id}`;
        secao.setAttribute("aria-labelledby", titulo.id);
        titulo.appendChild(criar("span", "selo selo--neutro", `${itens.length} ${itens.length === 1 ? "prato" : "pratos"}`));
        const grade = criar("div", "grade-cartoes");
        itens.forEach((prato) => grade.appendChild(criarCartao(prato)));
        secao.append(titulo, grade);
        lista.appendChild(secao);
      });
      const nomeCategoria = categorias.find((categoria) => String(categoria.id) === categoriaAtual)?.nome;
      $("texto-vazio").textContent = !categorias.length
        ? "Crie uma categoria para começar a organizar os pratos."
        : nomeCategoria ? `Nenhum prato cadastrado em “${nomeCategoria}”.` : "Nenhum prato cadastrado ainda.";
      $("resumo-lista").textContent = `${pratos.length} ${pratos.length === 1 ? "prato encontrado" : "pratos encontrados"}`;
      $("estado-vazio").hidden = pratos.length > 0;
      lista.hidden = pratos.length === 0;
    }

    async function carregarPratos(limpar = true) {
      controlador?.abort();
      controlador = new AbortController();
      const requisicao = controlador;
      const atual = ++versao;
      if (limpar) JoseAPI.limparMensagem();
      $("carregando").hidden = false;
      $("tentar-novamente").hidden = true;
      $("estado-vazio").hidden = true;
      $("lista-pratos").hidden = true;
      $("lista-pratos").setAttribute("aria-busy", "true");
      $("resumo-lista").textContent = "";
      try {
        if (categoriaAtual && (!JoseAPI.idValido(categoriaAtual) || !categorias.some((categoria) => String(categoria.id) === categoriaAtual))) {
          throw new JoseAPI.ErroAPI("Categoria não encontrada. Escolha outra categoria ou veja todos os pratos.", 404);
        }
        const caminho = `/pratos${categoriaAtual ? `?categoria_id=${encodeURIComponent(categoriaAtual)}` : ""}`;
        const pratos = await JoseAPI.requisitar(caminho, { signal: requisicao.signal });
        if (atual !== versao) return;
        renderizar(pratos);
      } catch (erro) {
        if (requisicao.signal.aborted || atual !== versao) return;
        JoseAPI.exibirErro(erro);
        $("tentar-novamente").hidden = false;
      } finally {
        if (atual === versao) {
          $("carregando").hidden = true;
          $("lista-pratos").setAttribute("aria-busy", "false");
        }
      }
    }

    async function carregarCategorias() {
      $("carregando").hidden = false;
      $("tentar-novamente").hidden = true;
      JoseAPI.limparMensagem();
      try {
        categorias = await JoseAPI.requisitar("/categorias");
        categoriasCarregadas = true;
        opcoesCategorias(filtro, categorias, "Todas as categorias");
        if (categoriaAtual && !categorias.some((categoria) => String(categoria.id) === categoriaAtual)) {
          const indisponivel = criar("option", "", "Categoria indisponível");
          indisponivel.value = categoriaAtual;
          indisponivel.disabled = true;
          filtro.appendChild(indisponivel);
        }
        filtro.value = categoriaAtual;
        filtro.disabled = false;
        atualizarLinks();
        JoseAPI.mostrarSucesso();
        await carregarPratos(false);
      } catch (erro) {
        JoseAPI.exibirErro(erro);
        $("carregando").hidden = true;
        $("tentar-novamente").hidden = false;
      }
    }

    filtro.addEventListener("change", () => {
      categoriaAtual = filtro.value;
      history.replaceState(null, "", caminhoLista(categoriaAtual));
      atualizarLinks();
      carregarPratos();
    });
    $("tentar-novamente").addEventListener("click", () => categoriasCarregadas ? carregarPratos() : carregarCategorias());
    await carregarCategorias();
  }

  function normalizarPreco(valor) {
    const texto = valor.trim();
    if (!/^\d{1,8}([.,]\d{1,2})?$/.test(texto)) {
      throw new JoseAPI.ErroAPI("Informe um preço válido, com até duas casas decimais e sem separador de milhar.", 400, "preco");
    }
    const [inteiros, decimais = ""] = texto.replace(",", ".").split(".");
    const centavos = Number(inteiros) * 100 + Number(decimais.padEnd(2, "0"));
    if (centavos <= 0 || centavos > 9999999999) {
      throw new JoseAPI.ErroAPI("Informe um preço maior que zero e de até 99.999.999,99.", 400, "preco");
    }
    return `${Number(inteiros)}.${decimais.padEnd(2, "0")}`;
  }

  async function iniciarFormulario() {
    const formulario = $("formulario");
    const id = parametros.get("id");
    let categoriaRetorno = parametros.get("categoria") || "";
    let categorias = [];
    let carregado = false;
    let salvando = false;
    const edicao = id !== null;
    const titulo = edicao ? "Editar prato" : "Novo prato";
    $("titulo-formulario").textContent = titulo;
    $("trilha-formulario").textContent = titulo;
    document.title = `${titulo} — Sabor Caseiro`;
    function atualizarVolta() {
      const destino = caminhoLista(categoriaRetorno);
      $("voltar-pratos").href = destino;
      $("cancelar").href = destino;
    }
    atualizarVolta();

    async function prepararFormulario() {
      carregado = false;
      $("painel-formulario").hidden = true;
      $("sem-categorias").hidden = true;
      $("carregando").hidden = false;
      $("tentar-novamente").hidden = true;
      JoseAPI.limparMensagem();
      try {
        if (edicao && !JoseAPI.idValido(id)) throw new JoseAPI.ErroAPI("O identificador do prato é inválido.", 400);
        const resultados = await Promise.all([
          JoseAPI.requisitar("/categorias"),
          edicao ? JoseAPI.requisitar(`/pratos/${encodeURIComponent(id)}`) : Promise.resolve(null),
        ]);
        categorias = resultados[0];
        const prato = resultados[1];
        opcoesCategorias($("categoria_id"), categorias, "Selecione uma categoria");
        if (!categorias.length) {
          $("sem-categorias").hidden = false;
          return;
        }
        if (edicao) {
          $("nome").value = prato.nome;
          $("descricao").value = prato.descricao || "";
          $("preco").value = String(prato.preco).replace(".", ",");
          $("categoria_id").value = String(prato.categoria_id);
          if (!categoriaRetorno) categoriaRetorno = String(prato.categoria_id);
        } else if (categoriaRetorno) {
          if (JoseAPI.idValido(categoriaRetorno) && categorias.some((categoria) => String(categoria.id) === categoriaRetorno)) {
            $("categoria_id").value = categoriaRetorno;
          } else {
            categoriaRetorno = "";
            JoseAPI.mensagem("A categoria indicada não está disponível. Selecione uma categoria para o prato.", "aviso");
          }
        }
        atualizarVolta();
        carregado = true;
        $("painel-formulario").hidden = false;
      } catch (erro) {
        JoseAPI.exibirErro(erro);
        $("tentar-novamente").hidden = false;
      } finally {
        $("carregando").hidden = true;
      }
    }

    formulario.addEventListener("submit", async (evento) => {
      evento.preventDefault();
      if (!carregado || salvando || !JoseAPI.validarTexto(formulario)) return;
      let preco;
      try {
        if (!categorias.some((categoria) => String(categoria.id) === $("categoria_id").value)) {
          throw new JoseAPI.ErroAPI("Selecione uma categoria existente.", 400, "categoria_id");
        }
        preco = normalizarPreco($("preco").value);
      } catch (erro) {
        JoseAPI.exibirErro(erro, formulario);
        return;
      }
      const dados = {
        nome: $("nome").value.trim(),
        descricao: $("descricao").value.trim() || null,
        preco,
        categoria_id: $("categoria_id").value,
      };
      salvando = true;
      JoseAPI.pendente(formulario, true);
      try {
        await JoseAPI.requisitar(edicao ? `/pratos/${encodeURIComponent(id)}` : "/pratos", {
          method: edicao ? "PUT" : "POST", body: dados,
        });
        JoseAPI.lembrarSucesso(edicao ? "Prato atualizado com sucesso." : "Prato cadastrado com sucesso.");
        location.assign(caminhoLista(dados.categoria_id));
      } catch (erro) {
        JoseAPI.pendente(formulario, false);
        JoseAPI.exibirErro(erro, formulario);
      } finally {
        if (formulario.getAttribute("aria-busy") === "true") JoseAPI.pendente(formulario, false);
        salvando = false;
      }
    });
    $("tentar-novamente").addEventListener("click", prepararFormulario);
    await prepararFormulario();
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (document.body.dataset.tela === "pratos-lista") iniciarLista();
    else if (document.body.dataset.tela === "prato-formulario") iniciarFormulario();
  });
})();
