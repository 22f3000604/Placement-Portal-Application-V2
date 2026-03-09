from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from app.models import User


def role_required(*roles):
    """Decorator to restrict access to specific roles."""
    def wrapper(fn):
        @wraps(fn)
        def decorated(*args, **kwargs):
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            user = User.query.get(user_id)

            if not user:
                return jsonify({'error': 'User not found'}), 404

            if not user.is_active:
                return jsonify({'error': 'Account is deactivated'}), 403

            if user.role not in roles:
                return jsonify({'error': 'Access denied. Insufficient permissions.'}), 403

            # Check blacklisted status for company and student
            if user.role == 'company' and user.company_profile:
                if user.company_profile.is_blacklisted:
                    return jsonify({'error': 'Your company has been blacklisted'}), 403
                if user.company_profile.approval_status != 'approved' and 'company' in roles:
                    if user.company_profile.approval_status == 'pending':
                        return jsonify({'error': 'Your company registration is pending approval'}), 403
                    elif user.company_profile.approval_status == 'rejected':
                        return jsonify({'error': 'Your company registration was rejected'}), 403

            if user.role == 'student' and user.student_profile:
                if user.student_profile.is_blacklisted:
                    return jsonify({'error': 'Your account has been blacklisted'}), 403

            return fn(*args, **kwargs)
        return decorated
    return wrapper


def get_current_user():
    """Get the current authenticated user."""
    user_id = get_jwt_identity()
    return User.query.get(user_id)
