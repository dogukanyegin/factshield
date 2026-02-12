
from app import app, db
from models import User
from werkzeug.security import generate_password_hash

def init():
    with app.app_context():
        db.create_all()
        
        # Check if admin already exists
        if not User.query.filter_by(username='admin').first():
            print("Creating default admin user...")
            admin_user = User(
                username='admin',
                password_hash=generate_password_hash('admin123')
            )
            db.session.add(admin_user)
            db.session.commit()
            print("Database initialized! Username: admin, Password: admin123")
        else:
            print("Database already initialized.")

if __name__ == '__main__':
    init()
