import os
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS

from api.categorias import categorias_bp
from api.pratos import pratos_bp



load_dotenv(Path(__file__).with_name(".env"))

app = Flask(__name__)
app.config["DATABASE_URL"] = os.getenv("DATABASE_URL")
app.register_blueprint(pratos_bp)
app.register_blueprint(categorias_bp)

origem = os.getenv("CORS_ORIGIN")
if origem:
    CORS(app, resources={r"/api/.*": {"origins": [origem]}})

if __name__ == "__main__":
    app.run(port=int(os.getenv("PORT", "3000")))
