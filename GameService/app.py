import os
import time
import requests
from flask import Flask
from models.database import db  
from models.game import Game
from server import register_routes  
from circuitbreaker import CircuitBreaker  # Import CircuitBreaker

# Service discovery URL (ensure it's correct in production or container environments)
SERVICE_DISCOVERY_URL = os.getenv('SERVICE_DISCOVERY_URL', 'http://discovery:3005/register')

# Configuration Constants
TASK_TIMEOUT_LIMIT = 5000  # Task timeout in milliseconds
RETRY_WINDOW = 3.5 * TASK_TIMEOUT_LIMIT  # Retry window in milliseconds (3.5 times timeout)
FAILURE_THRESHOLD = 3  # Number of allowed failures within the retry window
COOLDOWN_PERIOD = 10  # Cooldown period in seconds before resetting the circuit

# Initialize CircuitBreaker
breaker = CircuitBreaker(TASK_TIMEOUT_LIMIT, RETRY_WINDOW, FAILURE_THRESHOLD, COOLDOWN_PERIOD)

def register_service(service_name, service_address, service_port, replica_id):
    """Register service with service discovery, using CircuitBreaker to manage retries on failure."""
    try:
        # Check if circuit breaker is open before making the service call
        if breaker.is_open():
            print(f"Circuit breaker is open, skipping service registration for {service_name}.")
            return

        response = requests.post(SERVICE_DISCOVERY_URL, json={
            'name': service_name,
            'address': service_address,
            'port': service_port,
            'replicaId': replica_id  # Add the replicaId field
        }, timeout=TASK_TIMEOUT_LIMIT / 1000)  # Convert timeout to seconds
        
        # Check the response status
        if response.status_code == 201:
            print(f"Service registered: {service_name} at {service_address}:{service_port} with replicaId {replica_id}")
            return response
        else:
            print(f"Failed to register service {service_name}: {response.json()}")
            breaker.trip(service_name)  # Trip the circuit breaker on failure
    except requests.exceptions.RequestException as e:
        # Handle network-related errors
        print(f"Error while registering service: {e}")
        breaker.trip(service_name)  # Trip the circuit breaker on error

def create_app():
    app = Flask(__name__)

    # Get database URI from environment or use a default for development
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URI', 'sqlite:///game.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)  
    
    with app.app_context():
        db.create_all()  # Create tables if they don't exist

    register_routes(app)

    # Fetch dynamic service details from environment variables
    service_name = os.getenv('SERVICE_NAME', 'game_service')  # Fetch service name, like 'game_service_1'
    service_address = os.getenv('HOSTNAME', 'localhost')  # Docker container hostname
    service_port = int(os.getenv('SERVICE_PORT', '5002'))  # Dynamic port based on container (5002 is default)
    replica_id = os.getenv('REPLICA_ID', '1')  # This could be dynamically set to differentiate replicas
    while True:
        try:
            response = requests.get("http://discovery:3005/status")
            if response.status_code == 200:
                break
        except requests.ConnectionError:
            print("Discovery service not available, retrying...")
        time.sleep(5)
    # Register service with circuit breaker logic
    register_service(service_name, service_address, service_port, replica_id)

    return app

if __name__ == "__main__":
    # Ensure production-ready environment variables or defaults
    app = create_app()
    service_port = int(os.getenv('SERVICE_PORT', 5002))  # Default to 5002 if not specified
    app.run(port=service_port, host="0.0.0.0", debug=True)
