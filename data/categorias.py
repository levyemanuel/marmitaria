from data.conexao import conectar


def listar():
    with conectar() as conexao:
        return conexao.execute(
            "SELECT id, nome, descricao FROM categorias ORDER BY id"
        ).fetchall()


def inserir(campos):
    with conectar() as conexao:
        return conexao.execute(
            """
            INSERT INTO categorias (nome, descricao)
            VALUES (%(nome)s, %(descricao)s)
            RETURNING id, nome, descricao
            """,
            campos,
        ).fetchone()


def atualizar(categoria_id, campos):
    with conectar() as conexao:
        return conexao.execute(
            """
            UPDATE categorias
            SET nome = %(nome)s, descricao = %(descricao)s
            WHERE id = %(id)s
            RETURNING id, nome, descricao
            """,
            dict(campos, id=categoria_id),
        ).fetchone()


def excluir(categoria_id):
    with conectar() as conexao:
        resultado = conexao.execute(
            "DELETE FROM categorias WHERE id = %s", (categoria_id,)
        )
        return resultado.rowcount == 1
