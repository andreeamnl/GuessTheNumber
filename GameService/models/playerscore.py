from models.database import db

class PlayerScore(db.Model):
    __tablename__ = 'player_scores'
    
    id = db.Column(db.Integer, primary_key=True)
    game_id = db.Column(db.Integer, db.ForeignKey('games.id'), nullable=False)  # Foreign key to Game
    user_id = db.Column(db.Integer, nullable=False)  # Player's user_id
    attempts = db.Column(db.Integer, default=0)  # Number of attempts
    target_number = db.Column(db.Integer, nullable=False)  # Target number for the game

    def __init__(self, game_id, user_id, target_number):
        self.game_id = game_id
        self.user_id = user_id
        self.target_number = target_number
