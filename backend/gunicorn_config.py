"""Gunicorn production settings for CargoBridge (unix socket + nginx)."""
from __future__ import annotations

import multiprocessing
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
_LOG_DIR = BASE_DIR / 'logs'
_LOG_DIR.mkdir(parents=True, exist_ok=True)

# nginx proxies to this socket (ensure the systemd user can create/write it).
bind = 'unix:/run/cargobridge.sock'
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = 'sync'
timeout = 60

accesslog = str(_LOG_DIR / 'gunicorn-access.log')
errorlog = str(_LOG_DIR / 'gunicorn-error.log')
capture_output = True
