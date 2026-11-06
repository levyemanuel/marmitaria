from data.conexao import conectar


def listar(categoria_id=None):
    consulta = "SELECT id, nome, descricao, preco, categoria_id FROM pratos"
    parametros = ()
    if categoria_id is not None:
        consulta += " WHERE categoria_id = %s"
        parametros = (categoria_id,)

    with conectar() as conexao:
        return conexao.execute(consulta + " ORDER BY id", parametros).fetchall()


def inserir(campos):
    with conectar() as conexao:
        return conexao.execute(
            """
            INSERT INTO pratos (nome, descricao, preco, categoria_id)
            VALUES (%(nome)s, %(descricao)s, %(preco)s, %(categoria_id)s)
            RETURNING id, nome, descricao, preco, categoria_id
            """,
            campos,
        ).fetchone()


def atualizar(prato_id, campos):
    with conectar() as conexao:
        return conexao.execute(
            """
            UPDATE pratos
            SET nome = %(nome)s,
                descricao = %(descricao)s,
                preco = %(preco)s,
                categoria_id = %(categoria_id)s
            WHERE id = %(id)s
            RETURNING id, nome, descricao, preco, categoria_id
            """,
            dict(campos, id=prato_id),
        ).fetchone()


def excluir(prato_id):
    with conectar() as conexao:
        resultado = conexao.execute("DELETE FROM pratos WHERE id = %s", (prato_id,))
        return resultado.rowcount == 1
