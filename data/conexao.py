import psycopg
from flask import current_app
from psycopg.rows import dict_row


def conectar():
    url = current_app.config["DATABASE_URL"]
    if not url:
        raise psycopg.OperationalError("Configure a variável DATABASE_URL.")
    return psycopg.connect(url, connect_timeout=5, row_factory=dict_row)
