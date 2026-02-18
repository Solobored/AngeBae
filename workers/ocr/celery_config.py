"""
Celery Configuration
"""

import os
from dotenv import load_dotenv

load_dotenv()

# Broker settings
broker_url = os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0')
result_backend = os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/1')

# Task settings
task_serializer = 'json'
result_serializer = 'json'
accept_content = ['json']
timezone = 'UTC'
enable_utc = True

# Task routing
task_routes = {
    'tasks.process_ocr_job': {'queue': 'ocr'},
    'tasks.cleanup_old_jobs': {'queue': 'maintenance'},
}

# Periodic tasks (Celery Beat)
from celery.schedules import crontab

beat_schedule = {
    'cleanup-old-jobs': {
        'task': 'tasks.cleanup_old_jobs',
        'schedule': crontab(hour=2, minute=0),  # Run at 2 AM daily
    },
}
