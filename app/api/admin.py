import io
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from sqlalchemy import func, extract
from app.extensions import db, cache
from app.models import User, CompanyProfile, StudentProfile, PlacementDrive, Application
from app.utils.auth_helpers import role_required, get_current_user

admin_bp = Blueprint('admin', __name__)


def _clear_admin_caches():
    """Clear all admin-related cache keys when data changes."""
    cache.delete_many(
        'admin_dashboard_stats',
        'admin_companies_all',
        'admin_students_all',
        'admin_drives_all',
        'admin_applications_all',
        'admin_analytics'
    )


@admin_bp.route('/dashboard', methods=['GET'])
@role_required('admin')
def dashboard():
    stats = cache.get('admin_dashboard_stats')
    if stats is None:
        stats = {
            'total_students': StudentProfile.query.count(),
            'total_companies': CompanyProfile.query.count(),
            'total_drives': PlacementDrive.query.count(),
            'total_applications': Application.query.count(),
            'pending_companies': CompanyProfile.query.filter_by(approval_status='pending').count(),
            'pending_drives': PlacementDrive.query.filter_by(status='pending').count(),
            'approved_companies': CompanyProfile.query.filter_by(approval_status='approved').count(),
            'approved_drives': PlacementDrive.query.filter_by(status='approved').count(),
            'total_selected': Application.query.filter_by(status='selected').count(),
            'total_rejected': Application.query.filter_by(status='rejected').count()
        }
        cache.set('admin_dashboard_stats', stats, timeout=300)
    return jsonify(stats), 200


# ── Company Management ──────────────────────────────────────────────

@admin_bp.route('/companies', methods=['GET'])
@role_required('admin')
def list_companies():
    search = request.args.get('search', '')
    status = request.args.get('status', '')

    # Use cache for unfiltered requests
    if not search and not status:
        result = cache.get('admin_companies_all')
        if result is not None:
            return jsonify(result), 200

    query = CompanyProfile.query
    if search:
        query = query.filter(CompanyProfile.company_name.ilike(f'%{search}%'))
    if status:
        query = query.filter_by(approval_status=status)

    companies = query.all()
    result = [c.to_dict() for c in companies]

    if not search and not status:
        cache.set('admin_companies_all', result, timeout=300)

    return jsonify(result), 200


@admin_bp.route('/companies/<int:company_id>/approve', methods=['PUT'])
@role_required('admin')
def approve_company(company_id):
    company = CompanyProfile.query.get_or_404(company_id)
    company.approval_status = 'approved'
    db.session.commit()
    _clear_admin_caches()
    return jsonify({'message': f'{company.company_name} approved successfully'}), 200


@admin_bp.route('/companies/<int:company_id>/reject', methods=['PUT'])
@role_required('admin')
def reject_company(company_id):
    company = CompanyProfile.query.get_or_404(company_id)
    company.approval_status = 'rejected'
    db.session.commit()
    _clear_admin_caches()
    return jsonify({'message': f'{company.company_name} rejected'}), 200


@admin_bp.route('/companies/<int:company_id>/blacklist', methods=['PUT'])
@role_required('admin')
def blacklist_company(company_id):
    company = CompanyProfile.query.get_or_404(company_id)
    company.is_blacklisted = not company.is_blacklisted
    db.session.commit()
    _clear_admin_caches()
    action = 'blacklisted' if company.is_blacklisted else 'unblacklisted'
    return jsonify({'message': f'{company.company_name} {action}'}), 200


# ── Student Management ──────────────────────────────────────────────

@admin_bp.route('/students', methods=['GET'])
@role_required('admin')
def list_students():
    search = request.args.get('search', '')

    # Use cache for unfiltered requests
    if not search:
        result = cache.get('admin_students_all')
        if result is not None:
            return jsonify(result), 200

    query = StudentProfile.query
    if search:
        query = query.filter(
            db.or_(
                StudentProfile.full_name.ilike(f'%{search}%'),
                StudentProfile.roll_number.ilike(f'%{search}%'),
                StudentProfile.branch.ilike(f'%{search}%')
            )
        )

    students = query.all()
    result = [s.to_dict() for s in students]

    if not search:
        cache.set('admin_students_all', result, timeout=300)

    return jsonify(result), 200


@admin_bp.route('/students/<int:student_id>/blacklist', methods=['PUT'])
@role_required('admin')
def blacklist_student(student_id):
    student = StudentProfile.query.get_or_404(student_id)
    student.is_blacklisted = not student.is_blacklisted
    db.session.commit()
    _clear_admin_caches()
    action = 'blacklisted' if student.is_blacklisted else 'unblacklisted'
    return jsonify({'message': f'{student.full_name} {action}'}), 200


@admin_bp.route('/students/<int:student_id>/deactivate', methods=['PUT'])
@role_required('admin')
def deactivate_student(student_id):
    student = StudentProfile.query.get_or_404(student_id)
    user = student.user
    user.is_active = not user.is_active
    db.session.commit()
    _clear_admin_caches()
    action = 'deactivated' if not user.is_active else 'activated'
    return jsonify({'message': f'{student.full_name} {action}'}), 200


# ── Drive Management ────────────────────────────────────────────────

@admin_bp.route('/drives', methods=['GET'])
@role_required('admin')
def list_drives():
    status = request.args.get('status', '')
    search = request.args.get('search', '')

    # Use cache for unfiltered requests
    if not status and not search:
        result = cache.get('admin_drives_all')
        if result is not None:
            return jsonify(result), 200

    query = PlacementDrive.query
    if status:
        query = query.filter_by(status=status)
    if search:
        query = query.filter(PlacementDrive.job_title.ilike(f'%{search}%'))

    drives = query.order_by(PlacementDrive.created_at.desc()).all()
    result = [d.to_dict() for d in drives]

    if not status and not search:
        cache.set('admin_drives_all', result, timeout=300)

    return jsonify(result), 200


@admin_bp.route('/drives/<int:drive_id>/approve', methods=['PUT'])
@role_required('admin')
def approve_drive(drive_id):
    drive = PlacementDrive.query.get_or_404(drive_id)
    drive.status = 'approved'
    db.session.commit()
    _clear_admin_caches()
    return jsonify({'message': f'Drive "{drive.job_title}" approved'}), 200


@admin_bp.route('/drives/<int:drive_id>/reject', methods=['PUT'])
@role_required('admin')
def reject_drive(drive_id):
    drive = PlacementDrive.query.get_or_404(drive_id)
    drive.status = 'rejected'
    db.session.commit()
    _clear_admin_caches()
    return jsonify({'message': f'Drive "{drive.job_title}" rejected'}), 200


# ── Application Management ──────────────────────────────────────────

@admin_bp.route('/applications', methods=['GET'])
@role_required('admin')
def list_applications():
    status = request.args.get('status', '')

    # Use cache for unfiltered requests
    if not status:
        result = cache.get('admin_applications_all')
        if result is not None:
            return jsonify(result), 200

    query = Application.query
    if status:
        query = query.filter_by(status=status)

    applications = query.order_by(Application.applied_at.desc()).all()
    result = [a.to_dict() for a in applications]

    if not status:
        cache.set('admin_applications_all', result, timeout=120)

    return jsonify(result), 200


# ── Analytics ───────────────────────────────────────────────────────

@admin_bp.route('/analytics', methods=['GET'])
@role_required('admin')
def analytics():
    """Return chart-ready analytics data for the admin dashboard."""
    data = cache.get('admin_analytics')
    if data is not None:
        return jsonify(data), 200

    # 1. Application status breakdown
    status_counts = db.session.query(
        Application.status, func.count(Application.id)
    ).group_by(Application.status).all()
    status_map = dict(status_counts)

    application_status = {
        'labels': ['Applied', 'Shortlisted', 'Selected', 'Rejected'],
        'data': [
            status_map.get('applied', 0),
            status_map.get('shortlisted', 0),
            status_map.get('selected', 0),
            status_map.get('rejected', 0)
        ]
    }

    # 2. Top companies by application count
    top_companies = db.session.query(
        CompanyProfile.company_name,
        func.count(Application.id).label('app_count')
    ).join(PlacementDrive, PlacementDrive.company_id == CompanyProfile.id)\
     .join(Application, Application.drive_id == PlacementDrive.id)\
     .group_by(CompanyProfile.company_name)\
     .order_by(func.count(Application.id).desc())\
     .limit(8).all()

    top_companies_chart = {
        'labels': [c[0] for c in top_companies],
        'data': [c[1] for c in top_companies]
    }

    # 3. Branch-wise student distribution
    branch_data = db.session.query(
        StudentProfile.branch, func.count(StudentProfile.id)
    ).group_by(StudentProfile.branch).all()

    branch_chart = {
        'labels': [b[0] or 'Unknown' for b in branch_data],
        'data': [b[1] for b in branch_data]
    }

    # 4. Monthly application trends (last 6 months)
    six_months_ago = datetime.utcnow() - timedelta(days=180)
    monthly = db.session.query(
        extract('year', Application.applied_at).label('yr'),
        extract('month', Application.applied_at).label('mo'),
        func.count(Application.id)
    ).filter(Application.applied_at >= six_months_ago)\
     .group_by('yr', 'mo')\
     .order_by('yr', 'mo').all()

    month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    monthly_chart = {
        'labels': [f"{month_names[int(m[1])-1]} {int(m[0])}" for m in monthly],
        'data': [m[2] for m in monthly]
    }

    # 5. Placement rate
    total_apps = Application.query.count()
    selected = Application.query.filter_by(status='selected').count()
    placement_rate = round((selected / total_apps * 100), 1) if total_apps > 0 else 0

    data = {
        'application_status': application_status,
        'top_companies': top_companies_chart,
        'branch_distribution': branch_chart,
        'monthly_trends': monthly_chart,
        'placement_rate': placement_rate
    }

    cache.set('admin_analytics', data, timeout=300)
    return jsonify(data), 200


# ── PDF Report Download ─────────────────────────────────────────────

@admin_bp.route('/report/pdf', methods=['GET'])
@role_required('admin')
def download_report_pdf():
    """Download the monthly placement activity report as a PDF."""
    from flask import send_file as flask_send_file

    today = datetime.utcnow()
    first_of_month = today.replace(day=1)
    last_month_end = first_of_month - timedelta(days=1)
    last_month_start = last_month_end.replace(day=1)

    drives_conducted = PlacementDrive.query.filter(
        PlacementDrive.created_at >= last_month_start,
        PlacementDrive.created_at <= last_month_end
    ).count()

    applications = Application.query.filter(
        Application.applied_at >= last_month_start,
        Application.applied_at <= last_month_end
    ).all()

    stats = {
        'month_name': last_month_start.strftime('%B %Y'),
        'drives_conducted': drives_conducted,
        'total_applied': len(applications),
        'total_selected': sum(1 for a in applications if a.status == 'selected'),
        'total_rejected': sum(1 for a in applications if a.status == 'rejected'),
        'total_shortlisted': sum(1 for a in applications if a.status == 'shortlisted'),
        'total_students': StudentProfile.query.count(),
        'total_companies': CompanyProfile.query.filter_by(approval_status='approved').count(),
        'generated_at': today.strftime('%d %B %Y at %I:%M %p')
    }

    from app.utils.pdf_generator import generate_monthly_report_pdf
    pdf_bytes = generate_monthly_report_pdf(stats)

    return flask_send_file(
        io.BytesIO(pdf_bytes),
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f'placement_report_{stats["month_name"].replace(" ", "_")}.pdf'
    )


# ── Offer Letter Generator ──────────────────────────────────────────

@admin_bp.route('/offer-letter', methods=['POST'])
@role_required('admin')
def generate_offer_letter():
    """Generate a dummy offer letter PDF for a selected student."""
    from flask import send_file as flask_send_file
    data = request.get_json()

    application_id = data.get('application_id')
    if not application_id:
        return jsonify({'error': 'application_id is required'}), 400

    application = Application.query.get(application_id)
    if not application:
        return jsonify({'error': 'Application not found'}), 404

    student = application.student
    drive = application.drive
    company = drive.company

    from app.utils.pdf_generator import generate_offer_letter_pdf
    pdf_bytes = generate_offer_letter_pdf(
        company_name=company.company_name,
        student_name=student.full_name,
        job_title=drive.job_title,
        package_lpa=drive.package_lpa,
        location=drive.location
    )

    return flask_send_file(
        io.BytesIO(pdf_bytes),
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f'offer_letter_{student.full_name.replace(" ", "_")}.pdf'
    )


