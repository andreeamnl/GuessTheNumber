import uuid
from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
import requests
from models.database import db  # Import your existing db
from models.game import Game  # Import your updated models
from models.playerscore import PlayerScore  # Import your updated models
import json

USER_SERVICE_URL = "http://accounts_service:5001"  # Updated to point to accounts_service

import time

REQUEST_TIMEOUT = 0.0001



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

    @app.route('/status', methods=['GET'])
    def status():
        return jsonify({
            "status": "Service is running",
            "service": "Guess The Number Game Service",
            "version": "1.0.0"
        }), 200

    @app.route('/start-game/<user_id>', methods=['POST'])
    def start_game(user_id):
        response = requests.get(f"{USER_SERVICE_URL}/api/users/{user_id}")  
        if response.status_code != 200:
            return jsonify({"error": "User not found in accounts service."}), 404

        data = request.json
        target_number = data.get('target_number')
        
        if not isinstance(target_number, int) or target_number < 1 or target_number > 100:
            return jsonify({"error": "Target number must be an integer between 1 and 100."}), 400

        game_data = Game(
            status='in_progress'
        )
        
        db.session.add(game_data)
        db.session.commit() 

        player_score = PlayerScore(
            game_id=game_data.id,
            user_id=user_id,
            target_number=target_number
        )
        db.session.add(player_score)
        db.session.commit()

        return jsonify({
            "message": "Game started!",
            "game_id": game_data.id,
            "player_scores": {
                user_id: {"attempts": player_score.attempts, "target_number": player_score.target_number}
            }
        }), 200

    @app.route('/guess/<game_id>', methods=['POST'])
    def make_guess(game_id):
        data = request.json
        user_id = data.get('user_id')  
        guess = data.get('guess')

        game = Game.query.get(game_id)
        if not game:
            return jsonify({"error": "Game not found"}), 404

        # fix find player id
        player_score = PlayerScore.query.filter_by(game_id=game_id, user_id=user_id).first()
        if not player_score:
            return jsonify({"error": f"User {user_id} is not part of this game"}), 404

        # update
        player_score.attempts += 1

        
        if guess < player_score.target_number:
            db.session.commit()
            return jsonify({"message": "Higher!", "attempts": player_score.attempts}), 200
        elif guess > player_score.target_number:
            db.session.commit()
            return jsonify({"message": "Lower!", "attempts": player_score.attempts}), 200
        else:
            # finalize game
            game.status = 'completed'
            db.session.commit()
            return jsonify({"message": "Correct! You've guessed the number!", "attempts": player_score.attempts}), 200

    @app.route('/game/status/<game_id>', methods=['GET'])
    def get_game_status(game_id):
        game = Game.query.get(game_id)
        if not game:
            return jsonify({"error": "Game not found"}), 404

        # fetch all player scored
        player_scores = PlayerScore.query.filter_by(game_id=game_id).all()
        scores = {ps.user_id: {"attempts": ps.attempts, "target_number": ps.target_number} for ps in player_scores}

        return jsonify({
            "game_id": game.id,
            "status": game.status,
            "players_scores": scores
        }), 200
