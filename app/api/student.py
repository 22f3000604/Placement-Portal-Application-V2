import os
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from app.extensions import db, cache
from app.models import StudentProfile, PlacementDrive, Application
from app.utils.auth_helpers import role_required, get_current_user

student_bp = Blueprint('student', __name__)

ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx'}


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@student_bp.route('/dashboard', methods=['GET'])
@role_required('student')
def dashboard():
    user = get_current_user()
    student = user.student_profile

    # Get student's applications with drive info
    applications = Application.query.filter_by(student_id=student.id)\
        .order_by(Application.applied_at.desc()).all()

    # Cache the approved drives count (shared across students)
    approved_drives_count = cache.get('approved_drives_count')
    if approved_drives_count is None:
        approved_drives_count = PlacementDrive.query.filter_by(status='approved').count()
        cache.set('approved_drives_count', approved_drives_count, timeout=300)

    return jsonify({
        'student': student.to_dict(),
        'applications': [a.to_dict() for a in applications],
        'total_applications': len(applications),
        'total_selected': sum(1 for a in applications if a.status == 'selected'),
        'approved_drives_count': approved_drives_count
    }), 200


@student_bp.route('/drives', methods=['GET'])
@role_required('student')
def browse_drives():
    user = get_current_user()
    student = user.student_profile

    search = request.args.get('search', '')
    branch_filter = request.args.get('branch', '')
    eligible_only = request.args.get('eligible', 'false').lower() == 'true'

    cache_key = f'approved_drives_{search}_{branch_filter}_{eligible_only}_{student.id}'
    result = cache.get(cache_key)

    if result is None:
        query = PlacementDrive.query.filter_by(status='approved')

        if search:
            query = query.filter(
                db.or_(
                    PlacementDrive.job_title.ilike(f'%{search}%'),
                    PlacementDrive.job_description.ilike(f'%{search}%')
                )
            )

        if branch_filter:
            query = query.filter(PlacementDrive.eligibility_branch.ilike(f'%{branch_filter}%'))

        drives = query.order_by(PlacementDrive.application_deadline.asc()).all()

        # Filter by eligibility if requested
        if eligible_only:
            eligible_drives = []
            for drive in drives:
                is_eligible = True
                if drive.eligibility_cgpa and student.cgpa and student.cgpa < drive.eligibility_cgpa:
                    is_eligible = False
                if drive.eligibility_branch and student.branch:
                    branches = [b.strip().lower() for b in drive.eligibility_branch.split(',')]
                    if branches and student.branch.lower() not in branches and 'all' not in branches:
                        is_eligible = False
                if is_eligible:
                    eligible_drives.append(drive)
            drives = eligible_drives

        # Check which drives student has already applied to
        applied_drive_ids = set(
            a.drive_id for a in Application.query.filter_by(student_id=student.id).all()
        )

        result = []
        for d in drives:
            drive_data = d.to_dict()
            drive_data['already_applied'] = d.id in applied_drive_ids
            drive_data['deadline_passed'] = d.application_deadline < datetime.utcnow()

            # Eligibility check
            is_eligible = True
            reasons = []
            if d.eligibility_cgpa and student.cgpa and student.cgpa < d.eligibility_cgpa:
                is_eligible = False
                reasons.append(f'CGPA {d.eligibility_cgpa} required')
            if d.eligibility_branch and student.branch:
                branches = [b.strip().lower() for b in d.eligibility_branch.split(',')]
                if branches and student.branch.lower() not in branches and 'all' not in branches:
                    is_eligible = False
                    reasons.append(f'Branch not eligible')

            drive_data['is_eligible'] = is_eligible
            drive_data['ineligibility_reasons'] = reasons
            result.append(drive_data)

        cache.set(cache_key, result, timeout=60)

    return jsonify(result), 200


@student_bp.route('/drives/<int:drive_id>/apply', methods=['POST'])
@role_required('student')
def apply_to_drive(drive_id):
    user = get_current_user()
    student = user.student_profile

    drive = PlacementDrive.query.get_or_404(drive_id)

    # Check drive is approved
    if drive.status != 'approved':
        return jsonify({'error': 'This drive is not open for applications'}), 400

    # Check deadline
    if drive.application_deadline < datetime.utcnow():
        return jsonify({'error': 'Application deadline has passed'}), 400

    # Check duplicate application
    existing = Application.query.filter_by(student_id=student.id, drive_id=drive_id).first()
    if existing:
        return jsonify({'error': 'You have already applied to this drive'}), 409

    # Eligibility check
    if drive.eligibility_cgpa and student.cgpa and student.cgpa < drive.eligibility_cgpa:
        return jsonify({'error': f'Minimum CGPA of {drive.eligibility_cgpa} required'}), 400


    if drive.eligibility_branch and student.branch:
        branches = [b.strip().lower() for b in drive.eligibility_branch.split(',')]
        if branches and student.branch.lower() not in branches and 'all' not in branches:
            return jsonify({'error': 'Your branch is not eligible for this drive'}), 400

    # Handle resume file upload
    resume_path = None
    if 'resume' in request.files:
        file = request.files['resume']
        if file.filename and file.filename != '':
            if not allowed_file(file.filename):
                return jsonify({'error': 'Only PDF, DOC, and DOCX files are allowed'}), 400

            resume_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], 'resumes')
            os.makedirs(resume_folder, exist_ok=True)

            filename = secure_filename(f"{student.id}_{drive_id}_{file.filename}")
            filepath = os.path.join(resume_folder, filename)
            file.save(filepath)
            resume_path = filename

    application = Application(
        student_id=student.id,
        drive_id=drive_id,
        status='applied',
        resume_path=resume_path
    )
    db.session.add(application)
    db.session.commit()

    # Invalidate relevant caches
    cache.delete_many(
        'admin_dashboard_stats',
        'admin_applications_all'
    )

    return jsonify({'message': 'Application submitted successfully', 'application': application.to_dict()}), 201


@student_bp.route('/applications/<int:app_id>/resume', methods=['GET'])
@role_required('student')
def download_resume(app_id):
    from flask import send_from_directory
    application = Application.query.get_or_404(app_id)

    if not application.resume_path:
        return jsonify({'error': 'No resume attached to this application'}), 404

    resume_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], 'resumes')
    return send_from_directory(resume_folder, application.resume_path, as_attachment=True)


@student_bp.route('/applications', methods=['GET'])
@role_required('student')
def my_applications():
    user = get_current_user()
    student = user.student_profile

    applications = Application.query.filter_by(student_id=student.id)\
        .order_by(Application.applied_at.desc()).all()
    return jsonify([a.to_dict() for a in applications]), 200


@student_bp.route('/profile', methods=['GET'])
@role_required('student')
def get_profile():
    user = get_current_user()
    student = user.student_profile
    return jsonify(student.to_dict()), 200


@student_bp.route('/profile', methods=['PUT'])
@role_required('student')
def update_profile():
    user = get_current_user()
    student = user.student_profile
    data = request.get_json()

    if data.get('full_name'):
        student.full_name = data['full_name']
    if data.get('branch'):
        student.branch = data['branch']
    if data.get('year'):
        student.year = int(data['year'])
    if data.get('cgpa'):
        student.cgpa = float(data['cgpa'])
    if data.get('phone'):
        student.phone = data['phone']

    db.session.commit()
    return jsonify({'message': 'Profile updated successfully', 'student': student.to_dict()}), 200


@student_bp.route('/profile/resume', methods=['POST'])
@role_required('student')
def upload_resume():
    user = get_current_user()
    student = user.student_profile

    if 'resume' not in request.files:
        return jsonify({'error': 'No resume file provided'}), 400

    file = request.files['resume']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    if not allowed_file(file.filename):
        return jsonify({'error': 'Only PDF, DOC, and DOCX files are allowed'}), 400

    upload_folder = current_app.config['UPLOAD_FOLDER']
    os.makedirs(upload_folder, exist_ok=True)

    filename = secure_filename(f"resume_{student.roll_number}_{file.filename}")
    filepath = os.path.join(upload_folder, filename)
    file.save(filepath)

    student.resume_path = filename
    db.session.commit()

    return jsonify({'message': 'Resume uploaded successfully', 'filename': filename}), 200


@student_bp.route('/export', methods=['POST'])
@role_required('student')
def export_applications():
    user = get_current_user()
    student = user.student_profile

    try:
        from app.tasks.exports import export_student_applications
        task = export_student_applications.delay(student.id, user.email)
        return jsonify({
            'message': 'Export job started. You will be notified when it is ready.',
            'task_id': task.id
        }), 202
    except Exception as e:
        return jsonify({'error': f'Export failed to start: {str(e)}'}), 500
