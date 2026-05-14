"""Gunicorn configuration for Render deployment."""

import multiprocessing
import os

# Bind to PORT env var (Render sets this)
bind = f"0.0.0.0:{os.getenv('PORT', '8000')}"

# Workers: Render recommends 2-4 for most services
workers = int(os.getenv("WEB_CONCURRENCY", min(multiprocessing.cpu_count() * 2 + 1, 4)))
worker_class = "uvicorn.workers.UvicornWorker"

# Timeouts
timeout = 120
graceful_timeout = 30
keepalive = 5

# Logging
accesslog = "-"
errorlog = "-"
loglevel = os.getenv("LOG_LEVEL", "info")

# Preload app for faster worker startup
preload_app = True
