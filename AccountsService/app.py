import os
from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from models.database import db
from models.user import User
from server import register_routes  # Import route registration
from redis import Redis
import requests


def register_service(service_name, service_address, service_port):
    service_discovery_url = os.getenv('SERVICE_DISCOVERY_URL', 'http://discovery:3005/register')
    payload = {
        'name': service_name,
        'address': service_address,
        'port': service_port
    }

    try:
        response = requests.post(service_discovery_url, json=payload)
        if response.status_code == 201:
            print(f"{service_name} registered successfully!")
        else:
            print(f"Error registering service: {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"Failed to register service: {e}")


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

    # Register the accounts service in the service discovery
    service_name = 'accounts'
    service_address = 'accounts_service'  # Docker container name or IP
    service_port = 5001
    register_service(service_name, service_address, service_port)
    
    return app

if __name__ == "__main__":
    app = create_app()
    app.run(port=5001, host="0.0.0.0", debug=True)
