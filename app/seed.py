from app.extensions import db
from app.models import User
from app.config import Config


def seed_admin():
    """Create the admin user if it doesn't exist."""
    admin = User.query.filter_by(email=Config.ADMIN_EMAIL).first()
    if not admin:
        admin = User(
            email=Config.ADMIN_EMAIL,
            role='admin',
            is_active=True
        )
        admin.set_password(Config.ADMIN_PASSWORD)
        db.session.add(admin)
        db.session.commit()
        print(f'[SEED] Admin user created: {Config.ADMIN_EMAIL}')
    else:
        print(f'[SEED] Admin user already exists: {Config.ADMIN_EMAIL}')
