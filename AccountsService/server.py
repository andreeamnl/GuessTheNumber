# server.py
from flask import request, jsonify
from models.database import db
from models.user import User
import redis
import json

redis_client = redis.StrictRedis(host='redis', port=6379, db=0, decode_responses=True)

import time

REQUEST_TIMEOUT = 10


def register_routes(app):
    @app.before_request
    def start_timer():
        """Start the timer before each request."""
        request.start_time = time.time()

    @app.after_request
    def check_timeout(response):
        """Check if the request processing exceeded the timeout."""
        elapsed_time = time.time() - request.start_time
        if elapsed_time > REQUEST_TIMEOUT:
            response.status_code = 408
            response.data = json.dumps({"error": "Request timed out"})
            response.headers['Content-Type'] = 'application/json'
        return response
    
    @app.route('/api/users', methods=['POST'])
    def register_user():
        try:
            data = request.get_json()
            name = data['name']
            password = data['password']
            existing_user = User.query.filter_by(name=name).first()
            if existing_user:
                return jsonify({"error": "User already exists"}), 400
            user = User(name=name, password=password)
            db.session.add(user)
            db.session.commit()
            return jsonify({"message": "User registered successfully"}), 201
        except KeyError:
            return jsonify({"error": "Invalid request data"}), 400
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route('/api/users/login', methods=['POST'])
    def login_user():
        try:
            data = request.get_json()
            name = data['name']
            password = data['password']
            user = User.query.filter_by(name=name).first()
            if user and user.password == password:
                return jsonify({"message": "Login successful", "user_id": user.id}), 200
            else:
                return jsonify({"error": "Invalid credentials"}), 401
        except KeyError:
            return jsonify({"error": "Invalid request data"}), 400
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route('/api/users/<int:user_id>', methods=['GET'])
    def get_user_info(user_id):
        try:
            cached_user = redis_client.get(f"user:{user_id}")
            if cached_user:
                return jsonify(json.loads(cached_user)), 200  

            user = User.query.get(user_id)
            if user:
                user_info = {
                    "id": user.id,
                    "name": user.name
                }
                redis_client.setex(f"user:{user_id}", 300, json.dumps(user_info))  
                return jsonify(user_info), 200
            else:
                return jsonify({"error": "User not found"}), 404
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route('/api/users/<int:user_id>', methods=['DELETE'])
    def delete_user(user_id):
        try:
            user = User.query.get(user_id)
            if user:
                db.session.delete(user)
                db.session.commit()
                # Remove from Redis cache
                redis_client.delete(f"user:{user_id}")
                return jsonify({"message": "User deleted successfully"}), 200
            else:
                return jsonify({"error": "User not found"}), 404
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route('/api/users', methods=['GET'])
    def get_all_users():
        try:
            
            cached_users = redis_client.get("users_list")
            if cached_users:
                return jsonify(json.loads(cached_users)), 200  

            users = User.query.all()
            user_list = [{"id": user.id, "name": user.name} for user in users]  
            
            redis_client.setex("users_list", 300, json.dumps(user_list))  

            return jsonify(user_list), 200  
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route('/status', methods=['GET'])
    def status():
        return jsonify({
            "status": "Accounts service is running"
        }), 200
