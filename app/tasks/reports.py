from datetime import datetime, timedelta
from celery_worker import celery
from app.extensions import db, mail
from flask_mail import Message


@celery.task(name='app.tasks.reports.send_monthly_report')
def send_monthly_report():
    """Generate and send monthly placement activity report to admin."""
    from app.models import User, PlacementDrive, Application, StudentProfile, CompanyProfile

    # Calculate date range for last month
    today = datetime.utcnow()
    first_of_month = today.replace(day=1)
    last_month_end = first_of_month - timedelta(days=1)
    last_month_start = last_month_end.replace(day=1)

    # Gather statistics
    drives_conducted = PlacementDrive.query.filter(
        PlacementDrive.created_at >= last_month_start,
        PlacementDrive.created_at <= last_month_end
    ).count()

    applications = Application.query.filter(
        Application.applied_at >= last_month_start,
        Application.applied_at <= last_month_end
    ).all()

    total_applied = len(applications)
    total_selected = sum(1 for a in applications if a.status == 'selected')
    total_rejected = sum(1 for a in applications if a.status == 'rejected')
    total_shortlisted = sum(1 for a in applications if a.status == 'shortlisted')

    total_students = StudentProfile.query.count()
    total_companies = CompanyProfile.query.filter_by(approval_status='approved').count()

    month_name = last_month_start.strftime('%B %Y')

    html_report = f"""
    <html>
    <head>
        <style>
            body {{ font-family: 'Segoe UI', sans-serif; background: #f5f7fa; padding: 20px; }}
            .container {{ max-width: 650px; margin: auto; background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }}
            h1 {{ color: #4f46e5; border-bottom: 3px solid #4f46e5; padding-bottom: 10px; }}
            .stat-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }}
            .stat-card {{ background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 20px; border-radius: 10px; text-align: center; }}
            .stat-card h3 {{ font-size: 2em; margin: 0; }}
            .stat-card p {{ margin: 5px 0 0; opacity: 0.9; }}
            table {{ width: 100%; border-collapse: collapse; margin-top: 15px; }}
            th, td {{ padding: 10px 12px; border: 1px solid #e2e8f0; text-align: left; }}
            th {{ background: #4f46e5; color: white; }}
            tr:nth-child(even) {{ background: #f8fafc; }}
            .footer {{ margin-top: 25px; color: #64748b; font-size: 0.9em; text-align: center; }}
        </style>
    </head>
    <body>
        <div class="container">
            <h1>📊 Monthly Placement Report — {month_name}</h1>

            <div class="stat-grid">
                <div class="stat-card">
                    <h3>{drives_conducted}</h3>
                    <p>Drives Conducted</p>
                </div>
                <div class="stat-card">
                    <h3>{total_applied}</h3>
                    <p>Applications Received</p>
                </div>
                <div class="stat-card">
                    <h3>{total_selected}</h3>
                    <p>Students Selected</p>
                </div>
                <div class="stat-card">
                    <h3>{total_shortlisted}</h3>
                    <p>Students Shortlisted</p>
                </div>
            </div>

            <table>
                <tr><th>Metric</th><th>Count</th></tr>
                <tr><td>Total Registered Students</td><td>{total_students}</td></tr>
                <tr><td>Total Approved Companies</td><td>{total_companies}</td></tr>
                <tr><td>Drives This Month</td><td>{drives_conducted}</td></tr>
                <tr><td>Applications This Month</td><td>{total_applied}</td></tr>
                <tr><td>Selected</td><td>{total_selected}</td></tr>
                <tr><td>Shortlisted</td><td>{total_shortlisted}</td></tr>
                <tr><td>Rejected</td><td>{total_rejected}</td></tr>
            </table>

            <div class="footer">
                <p>Generated on {today.strftime('%d %B %Y at %I:%M %p')} — Placement Portal</p>
            </div>
        </div>
    </body>
    </html>
    """

    # Send to admin
    admin = User.query.filter_by(role='admin').first()
    if admin:
        try:
            msg = Message(
                subject=f'Placement Portal — Monthly Activity Report ({month_name})',
                recipients=[admin.email],
                html=html_report
            )
            mail.send(msg)
            return f'Monthly report for {month_name} sent to {admin.email}'
        except Exception as e:
            return f'Failed to send report: {e}'

    return 'No admin user found'
