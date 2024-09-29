# init_db.py
from app import create_app, db, User
def init_database():
    app = create_app()
    with app.app_context():
    # Create the database tables
        db.create_all()
        # Initialize the database with sample data (optional)
        sample_user = User(name="andreea", password="test")
        db.session.add(sample_user)
        db.session.commit()
if __name__ == "__main__":
 init_database()