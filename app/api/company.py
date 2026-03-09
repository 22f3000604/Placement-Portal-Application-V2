import os
from datetime import datetime
from flask import Blueprint, request, jsonify, send_from_directory, current_app
from app.extensions import db, cache
from app.models import CompanyProfile, PlacementDrive, Application
from app.utils.auth_helpers import role_required, get_current_user

company_bp = Blueprint('company', __name__)


@company_bp.route('/dashboard', methods=['GET'])
@role_required('company')
def dashboard():
    user = get_current_user()
    company = user.company_profile

    cache_key = f'company_dashboard_{company.id}'
    result = cache.get(cache_key)

    if result is None:
        drives = company.drives.all()
        drive_data = []
        for drive in drives:
            d = drive.to_dict()
            d['applicant_count'] = drive.applications.count()
            drive_data.append(d)

        result = {
            'company': company.to_dict(),
            'drives': drive_data,
            'total_drives': len(drives),
            'total_applicants': sum(d['applicant_count'] for d in drive_data)
        }
        cache.set(cache_key, result, timeout=120)

    return jsonify(result), 200


@company_bp.route('/drives', methods=['POST'])
@role_required('company')
def create_drive():
    user = get_current_user()
    company = user.company_profile

    if company.approval_status != 'approved':
        return jsonify({'error': 'Company must be approved to create drives'}), 403

    data = request.get_json()
    required = ['job_title', 'job_description', 'application_deadline']
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400

    try:
        deadline = datetime.fromisoformat(data['application_deadline'])
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid deadline format. Use ISO format (YYYY-MM-DD)'}), 400

    if deadline < datetime.utcnow():
        return jsonify({'error': 'Application deadline must be in the future'}), 400

    drive = PlacementDrive(
        company_id=company.id,
        job_title=data['job_title'],
        job_description=data['job_description'],
        package_lpa=float(data.get('package_lpa', 0)),
        location=data.get('location', ''),
        eligibility_branch=data.get('eligibility_branch', ''),
        eligibility_cgpa=float(data.get('eligibility_cgpa', 0)),
        application_deadline=deadline,
        status='pending'
    )
    db.session.add(drive)
    db.session.commit()

    # Invalidate caches
    cache.delete_many(
        'admin_dashboard_stats',
        'admin_drives_all',
        f'company_dashboard_{company.id}',
        f'company_drives_{company.id}'
    )

    return jsonify({'message': 'Placement drive created. Awaiting admin approval.', 'drive': drive.to_dict()}), 201


@company_bp.route('/drives', methods=['GET'])
@role_required('company')
def list_drives():
    user = get_current_user()
    company = user.company_profile

    cache_key = f'company_drives_{company.id}'
    result = cache.get(cache_key)

    if result is None:
        drives = company.drives.order_by(PlacementDrive.created_at.desc()).all()
        result = [d.to_dict() for d in drives]
        cache.set(cache_key, result, timeout=120)

    return jsonify(result), 200


@company_bp.route('/drives/<int:drive_id>', methods=['GET'])
@role_required('company')
def get_drive(drive_id):
    user = get_current_user()
    company = user.company_profile
    drive = PlacementDrive.query.filter_by(id=drive_id, company_id=company.id).first_or_404()
    return jsonify(drive.to_dict()), 200


@company_bp.route('/drives/<int:drive_id>/applications', methods=['GET'])
@role_required('company')
def drive_applications(drive_id):
    user = get_current_user()
    company = user.company_profile
    drive = PlacementDrive.query.filter_by(id=drive_id, company_id=company.id).first_or_404()

    applications = drive.applications.all()
    return jsonify({
        'drive': drive.to_dict(),
        'applications': [a.to_dict() for a in applications]
    }), 200


@company_bp.route('/applications/<int:app_id>/status', methods=['PUT'])
@role_required('company')
def update_application_status(app_id):
    user = get_current_user()
    company = user.company_profile

    application = Application.query.get_or_404(app_id)

    # Verify the application belongs to this company's drive
    drive = PlacementDrive.query.get(application.drive_id)
    if not drive or drive.company_id != company.id:
        return jsonify({'error': 'Access denied'}), 403

    data = request.get_json()
    new_status = data.get('status')
    valid_statuses = ['applied', 'shortlisted', 'selected', 'rejected']

    if new_status not in valid_statuses:
        return jsonify({'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'}), 400

    application.status = new_status
    application.remarks = data.get('remarks', application.remarks)
    db.session.commit()

    # Invalidate caches
    cache.delete_many(
        'admin_dashboard_stats',
        'admin_applications_all',
        f'company_dashboard_{company.id}'
    )

    return jsonify({'message': f'Application status updated to {new_status}', 'application': application.to_dict()}), 200


@company_bp.route('/applications/<int:app_id>/resume', methods=['GET'])
@role_required('company')
def download_application_resume(app_id):
    user = get_current_user()
    company = user.company_profile

    application = Application.query.get_or_404(app_id)

    # Verify the application belongs to this company's drive
    drive = PlacementDrive.query.get(application.drive_id)
    if not drive or drive.company_id != company.id:
        return jsonify({'error': 'Access denied'}), 403

    if not application.resume_path:
        return jsonify({'error': 'No resume attached to this application'}), 404

    resume_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], 'resumes')
    return send_from_directory(resume_folder, application.resume_path, as_attachment=True)
