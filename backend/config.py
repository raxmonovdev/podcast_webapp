import os
from pathlib import Path

from dotenv import load_dotenv

# backend/ papkasining usti — loyiha ildizi. .env shu yerda turadi.
ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env")

BOT_TOKEN = os.getenv("BOT_TOKEN", "")
WEBAPP_URL = os.getenv("WEBAPP_URL", "")
ALLOW_DEV_AUTH = os.getenv("ALLOW_DEV_AUTH", "true").lower() in ("1", "true", "yes")

# Hozircha yagona admin: @raxmonovdev
ADMIN_USERNAME = "raxmonovdev"

# "123, 456" kabi yozuvni sonlar ro'yxatiga aylantiradi. Noto'g'ri qator tashlab yuboriladi.
ADMIN_IDS = []
for part in os.getenv("ADMIN_IDS", "").split(","):
    part = part.strip()
    if part.isdigit():
        ADMIN_IDS.append(int(part))


def database_url():
    """sqlite:///./podcast.db ni loyiha ildizidagi aniq faylga bog'laydi."""
    raw = os.getenv("DATABASE_URL", "sqlite:///./podcast.db")
    prefix = "sqlite:///./"
    if raw.startswith(prefix):
        path = (ROOT / raw[len(prefix):]).resolve()
        return "sqlite:///" + str(path)
    return raw
