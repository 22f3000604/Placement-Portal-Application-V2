from celery import Celery
from app import create_app
from app.config import Config

def make_celery(app=None):
    app = app or create_app()
    celery = Celery(
        app.import_name,
        broker=app.config['CELERY_BROKER_URL'],
        backend=app.config['CELERY_RESULT_BACKEND']
    )
    celery.conf.update(app.config)

    # Celery Beat schedule
    celery.conf.beat_schedule = {
        'daily-reminders': {
            'task': 'app.tasks.reminders.send_daily_reminders',
            'schedule': 86400.0,  # Every 24 hours
        },
        'monthly-report': {
            'task': 'app.tasks.reports.send_monthly_report',
            'schedule': 2592000.0,  # ~30 days
        },
    }

    class ContextTask(celery.Task):
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return self.run(*args, **kwargs)

    celery.Task = ContextTask
    return celery

celery = make_celery()
