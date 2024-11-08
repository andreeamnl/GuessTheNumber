import os
import requests
from flask import Flask
from models.database import db  
from models.game import Game
from server import register_routes  

SERVICE_DISCOVERY_URL = os.getenv('SERVICE_DISCOVERY_URL', 'http://discovery:3005/register')

def register_service(service_name, service_address, service_port):
    try:
        response = requests.post(SERVICE_DISCOVERY_URL, json={
            'name': service_name,
            'address': service_address,
            'port': service_port
        })
        if response.status_code == 201:
            print(f"Service registered: {service_name} at {service_address}:{service_port}")
        else:
            print(f"Failed to register service {service_name}: {response.json()}")
    except requests.exceptions.RequestException as e:
        print(f"Error while registering service: {e}")

def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///game.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)  
    
    with app.app_context():
        db.create_all()  

    register_routes(app)

    service_name = 'game'
    service_address = 'game_service'  
    service_port = 5002  

    register_service(service_name, service_address, service_port)
    return app

if __name__ == "__main__":
    app = create_app()
    app.run(port=5002, host="0.0.0.0", debug=True)
