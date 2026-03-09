import csv
import os
from datetime import datetime
from celery_worker import celery
from app.extensions import db, mail
from flask_mail import Message


@celery.task(name='app.tasks.exports.export_student_applications')
def export_student_applications(student_id, student_email):
    """Export student's application history as CSV and send via email."""
    from app.models import Application, StudentProfile

    student = StudentProfile.query.get(student_id)
    if not student:
        return 'Student not found'

    applications = Application.query.filter_by(student_id=student_id)\
        .order_by(Application.applied_at.desc()).all()

    # Generate CSV
    export_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'exports')
    os.makedirs(export_dir, exist_ok=True)

    filename = f"applications_{student.roll_number}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
    filepath = os.path.join(export_dir, filename)

    with open(filepath, 'w', newline='') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(['Student ID', 'Roll Number', 'Company Name', 'Drive Title',
                         'Package (LPA)', 'Application Status', 'Applied Date', 'Remarks'])

        for app in applications:
            writer.writerow([
                student.id,
                student.roll_number,
                app.drive.company.company_name if app.drive and app.drive.company else 'N/A',
                app.drive.job_title if app.drive else 'N/A',
                app.drive.package_lpa if app.drive else 'N/A',
                app.status,
                app.applied_at.strftime('%Y-%m-%d %H:%M') if app.applied_at else 'N/A',
                app.remarks or ''
            ])

    # Send email with CSV attachment
    try:
        msg = Message(
            subject='Placement Portal — Your Application History Export',
            recipients=[student_email],
            html=f"""
            <h2>Hi {student.full_name},</h2>
            <p>Your placement application history has been exported successfully.</p>
            <p>Total applications: <strong>{len(applications)}</strong></p>
            <p>Please find the CSV file attached.</p>
            <p>— Placement Portal Team</p>
            """
        )

        with open(filepath, 'rb') as f:
            msg.attach(filename, 'text/csv', f.read())

        mail.send(msg)
        return f'Export completed. CSV sent to {student_email}'
    except Exception as e:
        return f'Export generated at {filepath} but email failed: {e}'
