from flask import Flask
from dotenv import load_dotenv
import os

load_dotenv()


def create_app():
    # Serve static UI from app/web at /web, and route /ui to index.html
    app = Flask(__name__, static_folder='web', static_url_path='/web')
    app.config['MONGO_URI'] = os.getenv('MONGO_URI', 'mongodb://localhost:27017')
    app.config['MONGO_DB'] = os.getenv('MONGO_DB', 'learning_rec')
    app.config['REC_EPSILON'] = float(os.getenv('REC_EPSILON', '0.1'))
    app.config['REC_MAX_CANDIDATES'] = int(os.getenv('REC_MAX_CANDIDATES', '200'))

    from .main import bp as main_bp
    app.register_blueprint(main_bp)

    return app
