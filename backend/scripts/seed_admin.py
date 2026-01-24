import sys
import os

# Add parent directory to path so we can import app and models
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from extensions import db
from models import User
from security_utils import hash_password

app = create_app()

def seed_admin():
    with app.app_context():
        email = "admin@gmail.com"
        password = "Admin123!"
        
        existing_user = User.query.filter_by(email=email).first()
        
        if existing_user:
            print(f"Admin user {email} already exists. Updating password...")
            existing_user.password_hash = hash_password(password)
            # Ensure role is admin
            existing_user.role = "admin"
            db.session.commit()
            print(f"Password reset to: {password}")
            
            # Still import products even if user exists
            pass
        else:
            print(f"Creating admin user {email}...")
            
            admin_user = User(
                first_name="Super",
                last_name="Admin",
                email=email,
                password_hash=hash_password(password),
                phone_number="+0000000000",
                address="Admin HQ",
                zip_code="00000",
                city="Admin City",
                country="Adminland",
                role="admin"
            )
            
            db.session.add(admin_user)
            db.session.commit()
            print(f"Successfully created admin user: {email}")
            print(f"Password: {password}")

        # Import products
        print("\n--- Starting Product Import ---")
        from services.importer import import_products_logic
        stats = import_products_logic()
        print(f"Product Import Finished: {stats}")

if __name__ == "__main__":
    seed_admin()
