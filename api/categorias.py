from flask import Blueprint, current_app, jsonify, request
from psycopg import Error, OperationalError
from psycopg.errors import ForeignKeyViolation, UniqueViolation

from data import categorias as repositorio_categorias
from services.categorias import validar_dados_categoria
from services.pratos import ErroValidacao, validar_id


categorias_bp = Blueprint("categorias", __name__, url_prefix="/api/categorias")


@categorias_bp.get("")
def listar_categorias():
    return jsonify(repositorio_categorias.listar())


@categorias_bp.post("")
def cadastrar_categoria():
    campos = validar_dados_categoria(request.get_json(silent=True))
    return jsonify(repositorio_categorias.inserir(campos)), 201


@categorias_bp.put("/<categoria_id>")
def editar_categoria(categoria_id):
    categoria_id = validar_id(categoria_id, "id")
    campos = validar_dados_categoria(request.get_json(silent=True))
    categoria = repositorio_categorias.atualizar(categoria_id, campos)
    if categoria is None:
        return jsonify(erro="Categoria não encontrada."), 404
    return jsonify(categoria)


@categorias_bp.delete("/<categoria_id>")
def excluir_categoria(categoria_id):
    categoria_id = validar_id(categoria_id, "id")
    if not repositorio_categorias.excluir(categoria_id):
        return jsonify(erro="Categoria não encontrada."), 404
    return "", 204


@categorias_bp.errorhandler(ErroValidacao)
def responder_erro_validacao(erro):
    resposta = {"erro": str(erro)}
    if erro.campo:
        resposta["campo"] = erro.campo
    return jsonify(resposta), 400


@categorias_bp.errorhandler(UniqueViolation)
def responder_nome_repetido(erro):
    if erro.diag.constraint_name != "categorias_nome_unico":
        return responder_erro_banco(erro)
    return jsonify(erro="Já existe uma categoria com esse nome.", campo="nome"), 409


@categorias_bp.errorhandler(ForeignKeyViolation)
def responder_categoria_com_pratos(_erro):
    return jsonify(
        erro="Não é possível excluir uma categoria com pratos cadastrados."
    ), 409


@categorias_bp.errorhandler(OperationalError)
def responder_banco_indisponivel(erro):
    current_app.logger.warning(
        "Banco indisponível na API de categorias (%s).", type(erro).__name__
    )
    return jsonify(erro="Banco de dados indisponível."), 503


@categorias_bp.errorhandler(Error)
def responder_erro_banco(erro):
    current_app.logger.error(
        "Erro na API de categorias (%s, SQLSTATE %s).", type(erro).__name__, erro.sqlstate
    )
    return jsonify(erro="Não foi possível concluir a operação no banco de dados."), 500
