from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from models.database import db
from models.user import User
from server import register_routes  # Import route registration
from redis import Redis

def create_app():
    app = Flask(__name__)
    CORS(app)
    
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
    db.init_app(app)
    
    register_routes(app)
    
    try:
        redis_client = Redis(host='redis', port=6379, db=0)
        redis_client.ping()  # Check if Redis is reachable
    except Exception as e:
        print("Could not connect to Redis:", e)
    
    return app

if __name__ == "__main__":
    app = create_app()
    app.run(port=5001, host="0.0.0.0", debug=True)
