from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.extensions import db, cache
from app.models import User, CompanyProfile, StudentProfile

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password are required'}), 400

    user = User.query.filter_by(email=data['email']).first()
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid email or password'}), 401

    if not user.is_active:
        return jsonify({'error': 'Your account has been deactivated'}), 403

    # Check company approval and blacklist
    if user.role == 'company' and user.company_profile:
        if user.company_profile.is_blacklisted:
            return jsonify({'error': 'Your company has been blacklisted'}), 403
        if user.company_profile.approval_status == 'pending':
            return jsonify({'error': 'Your company registration is pending admin approval'}), 403
        if user.company_profile.approval_status == 'rejected':
            return jsonify({'error': 'Your company registration was rejected'}), 403

    # Check student blacklist
    if user.role == 'student' and user.student_profile:
        if user.student_profile.is_blacklisted:
            return jsonify({'error': 'Your account has been blacklisted'}), 403

    access_token = create_access_token(identity=str(user.id))

    # Build user info
    user_info = user.to_dict()
    if user.role == 'company' and user.company_profile:
        user_info['company'] = user.company_profile.to_dict()
    elif user.role == 'student' and user.student_profile:
        user_info['student'] = user.student_profile.to_dict()

    return jsonify({
        'access_token': access_token,
        'user': user_info
    }), 200


@auth_bp.route('/register/student', methods=['POST'])
def register_student():
    data = request.get_json()

    # Validation
    required = ['email', 'password', 'full_name', 'roll_number', 'branch', 'year', 'cgpa']
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 409

    if StudentProfile.query.filter_by(roll_number=data['roll_number']).first():
        return jsonify({'error': 'Roll number already registered'}), 409

    try:
        user = User(email=data['email'], role='student', is_active=True)
        user.set_password(data['password'])
        db.session.add(user)
        db.session.flush()

        profile = StudentProfile(
            user_id=user.id,
            full_name=data['full_name'],
            roll_number=data['roll_number'],
            branch=data.get('branch', ''),
            year=int(data.get('year', 1)),
            cgpa=float(data.get('cgpa', 0.0)),
            phone=data.get('phone', '')
        )
        db.session.add(profile)
        db.session.commit()

        # Invalidate admin caches
        cache.delete_many('admin_dashboard_stats', 'admin_students_all')

        return jsonify({'message': 'Student registered successfully'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/register/company', methods=['POST'])
def register_company():
    data = request.get_json()

    # Validation
    required = ['email', 'password', 'company_name']
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 409

    try:
        user = User(email=data['email'], role='company', is_active=True)
        user.set_password(data['password'])
        db.session.add(user)
        db.session.flush()

        profile = CompanyProfile(
            user_id=user.id,
            company_name=data['company_name'],
            industry=data.get('industry', ''),
            hr_name=data.get('hr_name', ''),
            hr_email=data.get('hr_email', ''),
            hr_phone=data.get('hr_phone', ''),
            website=data.get('website', ''),
            description=data.get('description', ''),
            approval_status='pending'
        )
        db.session.add(profile)
        db.session.commit()

        # Invalidate admin caches
        cache.delete_many('admin_dashboard_stats', 'admin_companies_all')

        return jsonify({'message': 'Company registered successfully. Awaiting admin approval.'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_me():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({'error': 'User not found'}), 404

    user_info = user.to_dict()
    if user.role == 'company' and user.company_profile:
        user_info['company'] = user.company_profile.to_dict()
    elif user.role == 'student' and user.student_profile:
        user_info['student'] = user.student_profile.to_dict()

    return jsonify({'user': user_info}), 200
