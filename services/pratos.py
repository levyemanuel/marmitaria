from decimal import Decimal, InvalidOperation


CENTAVO = Decimal("0.01")
PRECO_MAXIMO = Decimal("99999999.99")
ID_MAXIMO = 2**63 - 1


class ErroValidacao(ValueError):
    def __init__(self, mensagem, campo=None):
        super().__init__(mensagem)
        self.campo = campo


def validar_id(valor, campo):
    if isinstance(valor, str) and len(valor) <= 19 and valor.isdecimal():
        valor = int(valor)
    if type(valor) is not int or not 1 <= valor <= ID_MAXIMO:
        raise ErroValidacao("Informe um identificador inteiro positivo válido.", campo)
    return valor


def _validar_texto(valor, campo, limite, obrigatorio=False):
    if valor is None:
        valor = ""
    if not isinstance(valor, str):
        raise ErroValidacao("Informe um texto válido para este campo.", campo)

    texto = valor.strip()
    if obrigatorio and not texto:
        raise ErroValidacao("O nome do prato é obrigatório.", campo)
    if len(texto) > limite:
        raise ErroValidacao(f"Use até {limite} caracteres.", campo)
    try:
        texto.encode("utf-8")
    except UnicodeEncodeError:
        raise ErroValidacao("O texto contém caracteres inválidos.", campo) from None
    if "\x00" in texto:
        raise ErroValidacao("O texto contém caracteres inválidos.", campo)
    return texto or None


def _validar_preco(valor):
    try:
        preco = Decimal(str(valor))
    except InvalidOperation:
        raise ErroValidacao("Informe um preço válido.", "preco") from None
    if not preco.is_finite() or not 0 < preco <= PRECO_MAXIMO:
        raise ErroValidacao("Informe um preço maior que zero e de até 99.999.999,99.", "preco")

    preco_com_centavos = preco.quantize(CENTAVO)
    if preco != preco_com_centavos:
        raise ErroValidacao("O preço deve ter até duas casas decimais.", "preco")
    return preco_com_centavos


def validar_dados_prato(dados):
    if not isinstance(dados, dict):
        raise ErroValidacao("Envie um objeto JSON com os dados do prato.")
    return {
        "nome": _validar_texto(dados.get("nome"), "nome", 100, obrigatorio=True),
        "descricao": _validar_texto(dados.get("descricao"), "descricao", 255),
        "preco": _validar_preco(dados.get("preco")),
        "categoria_id": validar_id(dados.get("categoria_id"), "categoria_id"),
    }
