from flask import Flask
from models.database import db  
from models.game import Game
from server import register_routes  

def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///game.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)  
    
    with app.app_context():
        db.create_all()  

    register_routes(app)  
    return app

if __name__ == "__main__":
    app = create_app()
    app.run(port=5002, host="0.0.0.0", debug=True)
