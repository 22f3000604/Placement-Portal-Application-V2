from flask import Flask, render_template
from app.extensions import db, jwt, cache, mail, cors
from app.config import Config


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    cache.init_app(app)
    mail.init_app(app)
    cors.init_app(app)

    # Register API blueprints
    from app.api.auth import auth_bp
    from app.api.admin import admin_bp
    from app.api.company import company_bp
    from app.api.student import student_bp

    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(company_bp, url_prefix='/api/company')
    app.register_blueprint(student_bp, url_prefix='/api/student')

    # Serve Vue SPA entry point
    @app.route('/')
    def index():
        return render_template('index.html')

    # Create tables and seed admin
    with app.app_context():
        db.create_all()
        from app.seed import seed_admin
        seed_admin()

    return app
