# init_db.py
from app import create_app
from models.database import db  # Import the db from your models.database
from models.game import Game  # Import the updated Game and PlayerScore models
from models.playerscore import  PlayerScore  # Import the updated Game and PlayerScore models

def init_database():
    app = create_app()
    with app.app_context():
        db.create_all()  # Create all tables in the database

        # Create a new game instance
        sample_game = Game(status="waiting")
        db.session.add(sample_game)
        db.session.commit()  # Commit to generate the game ID

        # Create player scores for the game
        player1_score = PlayerScore(game_id=sample_game.id, user_id=1, target_number=45)
        player2_score = PlayerScore(game_id=sample_game.id, user_id=2, target_number=32)

        # Add player scores to the session
        db.session.add(player1_score)
        db.session.add(player2_score)

        # Commit the transaction to save everything to the database
        db.session.commit()

if __name__ == "__main__":
    init_database()
