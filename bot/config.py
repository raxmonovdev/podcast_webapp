"""Bot sozlamalari .env dan o'qiladi."""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.config import ADMIN_IDS, BOT_TOKEN, WEBAPP_URL

__all__ = ["ADMIN_IDS", "BOT_TOKEN", "WEBAPP_URL"]
