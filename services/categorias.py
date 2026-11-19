from services.pratos import ErroValidacao, _validar_texto


def validar_dados_categoria(dados):
    if not isinstance(dados, dict):
        raise ErroValidacao("Envie um objeto JSON com os dados da categoria.")

    nome = _validar_texto(dados.get("nome"), "nome", 100)
    if nome is None:
        raise ErroValidacao("O nome da categoria é obrigatório.", "nome")

    return {
        "nome": nome,
        "descricao": _validar_texto(dados.get("descricao"), "descricao", 255),
    }
