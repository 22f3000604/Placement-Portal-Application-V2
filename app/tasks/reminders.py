from datetime import datetime, timedelta
from celery_worker import celery
from app.extensions import db, mail
from flask_mail import Message


@celery.task(name='app.tasks.reminders.send_daily_reminders')
def send_daily_reminders():
    """Send daily reminders to students about upcoming application deadlines."""
    from app.models import PlacementDrive, StudentProfile

    # Find drives with deadlines within next 2 days
    now = datetime.utcnow()
    upcoming_deadline = now + timedelta(days=2)

    drives = PlacementDrive.query.filter(
        PlacementDrive.status == 'approved',
        PlacementDrive.application_deadline >= now,
        PlacementDrive.application_deadline <= upcoming_deadline
    ).all()

    if not drives:
        return 'No upcoming deadlines found'

    # Get all active students
    students = StudentProfile.query.filter_by(is_blacklisted=False).all()

    reminders_sent = 0
    for student in students:
        if not student.user or not student.user.is_active:
            continue

        drive_list = ', '.join([
            f"{d.job_title} ({d.company.company_name}) - Deadline: {d.application_deadline.strftime('%d %b %Y')}"
            for d in drives
        ])

        try:
            msg = Message(
                subject='Placement Portal - Upcoming Application Deadlines',
                recipients=[student.user.email],
                html=f"""
                <h2>Hi {student.full_name},</h2>
                <p>The following placement drives have deadlines approaching:</p>
                <ul>
                    {''.join(f'<li>{d.job_title} at {d.company.company_name} — Deadline: {d.application_deadline.strftime("%d %b %Y %I:%M %p")}</li>' for d in drives)}
                </ul>
                <p>Don't miss out! <a href="http://127.0.0.1:5000/#/student/drives">Browse Drives</a></p>
                <p>— Placement Portal Team</p>
                """
            )
            mail.send(msg)
            reminders_sent += 1
        except Exception as e:
            print(f'Failed to send reminder to {student.user.email}: {e}')

    return f'Sent {reminders_sent} reminders for {len(drives)} drives'
