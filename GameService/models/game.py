from models.database import db

class Game(db.Model):
    __tablename__ = 'games'
    
    id = db.Column(db.Integer, primary_key=True)
    status = db.Column(db.String(50), nullable=False)
    players = db.relationship('PlayerScore', backref='game', lazy=True)  # Relationship to PlayerScore

    def __init__(self, status):
        self.status = status

