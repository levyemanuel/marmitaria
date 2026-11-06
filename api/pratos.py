from flask import Blueprint, current_app, jsonify, request
from psycopg import Error, OperationalError
from psycopg.errors import ForeignKeyViolation

from data import pratos as repositorio_pratos
from services.pratos import ErroValidacao, validar_dados_prato, validar_id


pratos_bp = Blueprint("pratos", __name__, url_prefix="/api/pratos")


@pratos_bp.get("")
def listar_pratos():
    categoria_id = request.args.get("categoria_id")
    if categoria_id is not None:
        categoria_id = validar_id(categoria_id, "categoria_id")
    return jsonify(repositorio_pratos.listar(categoria_id))


@pratos_bp.post("")
def cadastrar_prato():
    campos = validar_dados_prato(request.get_json(silent=True))
    return jsonify(repositorio_pratos.inserir(campos)), 201


@pratos_bp.put("/<prato_id>")
def editar_prato(prato_id):
    prato_id = validar_id(prato_id, "id")
    campos = validar_dados_prato(request.get_json(silent=True))
    prato = repositorio_pratos.atualizar(prato_id, campos)
    if prato is None:
        return jsonify(erro="Prato não encontrado."), 404
    return jsonify(prato)


@pratos_bp.delete("/<prato_id>")
def excluir_prato(prato_id):
    prato_id = validar_id(prato_id, "id")
    if not repositorio_pratos.excluir(prato_id):
        return jsonify(erro="Prato não encontrado."), 404
    return "", 204


@pratos_bp.errorhandler(ErroValidacao)
def responder_erro_validacao(erro):
    resposta = {"erro": str(erro)}
    if erro.campo:
        resposta["campo"] = erro.campo
    return jsonify(resposta), 400


@pratos_bp.errorhandler(ForeignKeyViolation)
def responder_categoria_inexistente(_erro):
    return jsonify(erro="A categoria informada não existe.", campo="categoria_id"), 400


@pratos_bp.errorhandler(OperationalError)
def responder_banco_indisponivel(erro):
    current_app.logger.warning(
        "Banco indisponível na API de pratos (%s).", type(erro).__name__
    )
    return jsonify(erro="Banco de dados indisponível."), 503


@pratos_bp.errorhandler(Error)
def responder_erro_banco(erro):
    current_app.logger.error(
        "Erro na API de pratos (%s, SQLSTATE %s).", type(erro).__name__, erro.sqlstate
    )
    return jsonify(erro="Não foi possível concluir a operação no banco de dados."), 500
