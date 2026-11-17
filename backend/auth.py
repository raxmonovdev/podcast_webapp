import hashlib
import hmac
import json
from time import time
from typing import Optional
from urllib.parse import parse_qsl

from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from backend.config import ADMIN_IDS, ADMIN_USERNAME, ALLOW_DEV_AUTH, BOT_TOKEN
from backend.database import get_db
from backend.models import User

# Brauzerda sinash uchun. Haqiqiy Telegram id lari bilan to'qnashmaydi.
DEV_TELEGRAM_ID = 9000000000001


def verify_init_data(init_data: str, bot_token: str) -> dict:
    """Telegram initData imzosini tekshiradi.

    Maxfiy kalit bot tokenidan chiqadi. Mijoz yuborgan hash shu kalit bilan
    qayta hisoblangan hashga teng bo'lmasa, so'rov rad etiladi.
    """
    if not bot_token:
        raise ValueError("BOT_TOKEN yo'q")

    parsed = dict(parse_qsl(init_data, keep_blank_values=True))
    received_hash = parsed.pop("hash", None)
    if not received_hash:
        raise ValueError("hash yo'q")

    check_string = "\n".join("%s=%s" % (key, value) for key, value in sorted(parsed.items()))
    secret = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
    calculated = hmac.new(secret, check_string.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(calculated, received_hash):
        raise ValueError("imzo noto'g'ri")

    auth_date = int(parsed.get("auth_date") or 0)
    # Bir sutkadan eski initData qayta ishlatilmasin.
    if time() - auth_date > 86400:
        raise ValueError("initData eskirgan")

    try:
        user = json.loads(parsed.get("user") or "{}")
    except json.JSONDecodeError as exc:
        raise ValueError("foydalanuvchi yo'q") from exc
    if "id" not in user:
        raise ValueError("foydalanuvchi yo'q")
    return user


def upsert_user(db: Session, telegram_id: int, first_name: str, username: Optional[str]) -> User:
    user = db.query(User).filter(User.telegram_id == telegram_id).one_or_none()
    if user is None:
        user = User(telegram_id=telegram_id, first_name=first_name or "", username=username)
        db.add(user)
    else:
        user.first_name = first_name or user.first_name
        user.username = username
    db.commit()
    db.refresh(user)
    return user


def is_admin(user: User) -> bool:
    """@raxmonovdev yoki ADMIN_IDS dagi id. Boshqa hisob kira olmaydi."""
    name = (user.username or "").strip().lstrip("@").lower()
    if name == ADMIN_USERNAME:
        return True
    return int(user.telegram_id) in ADMIN_IDS


def get_current_user(
    db: Session = Depends(get_db),
    x_telegram_init_data: Optional[str] = Header(default=None),
    x_dev_auth: Optional[str] = Header(default=None),
) -> User:
    # Har so'rovda imzo tekshiriladi. initData bor bo'lsa, dev rejim ishlamaydi.
    if x_telegram_init_data:
        try:
            data = verify_init_data(x_telegram_init_data, BOT_TOKEN)
        except ValueError as exc:
            raise HTTPException(status_code=401, detail=str(exc)) from exc
        return upsert_user(
            db,
            telegram_id=int(data["id"]),
            first_name=data.get("first_name") or "Foydalanuvchi",
            username=data.get("username"),
        )

    if ALLOW_DEV_AUTH and x_dev_auth == "1":
        return upsert_user(db, DEV_TELEGRAM_ID, "Mehmon", "mehmon")

    raise HTTPException(status_code=401, detail="Kirish tasdiqlanmadi")
