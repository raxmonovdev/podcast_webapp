import sys
from pathlib import Path

from aiogram import Router
from aiogram.filters import Command, CommandStart
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, Message, WebAppInfo

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.auth import upsert_user
from backend.config import ADMIN_IDS, ADMIN_USERNAME, WEBAPP_URL
from backend.database import SessionLocal

router = Router()


def remember_user(message: Message):
    person = message.from_user
    db = SessionLocal()
    try:
        upsert_user(
            db,
            telegram_id=person.id,
            first_name=person.first_name or "",
            username=person.username,
        )
    finally:
        db.close()


@router.message(CommandStart())
async def start(message: Message):
    remember_user(message)
    name = message.from_user.first_name or "do'st"
    text = "Assalomu alaykum, %s!\n\nIngliz tilini podcast orqali o'rganing 🎧" % name

    # Telegram WebApp tugmasi faqat https manzilni qabul qiladi.
    if WEBAPP_URL.startswith("https://"):
        keyboard = InlineKeyboardMarkup(
            inline_keyboard=[
                [InlineKeyboardButton(text="🎧 Eshitish", web_app=WebAppInfo(url=WEBAPP_URL))]
            ]
        )
        await message.answer(text + "\nPastdagi tugma ilovani ochadi.", reply_markup=keyboard)
        return

    hint = WEBAPP_URL or "http://127.0.0.1:5173"
    await message.answer(
        text
        + "\n\nIlovani Telegram ichida ochish uchun .env dagi WEBAPP_URL https bilan boshlanishi kerak "
        + "(ngrok yoki cloudflared).\nBrauzerda sinash: "
        + hint
    )


def caller_is_admin(message: Message):
    person = message.from_user
    name = (person.username or "").strip().lstrip("@").lower()
    if name == ADMIN_USERNAME:
        return True
    return person.id in ADMIN_IDS


@router.message(Command("admin"))
async def admin(message: Message):
    if not caller_is_admin(message):
        await message.answer("Bu bo'lim faqat admin uchun.")
        return
    remember_user(message)
    text = "Admin panel. Podcast, daraja va transcript shu yerda."
    if WEBAPP_URL.startswith("https://"):
        keyboard = InlineKeyboardMarkup(
            inline_keyboard=[
                [
                    InlineKeyboardButton(
                        text="Admin panel",
                        web_app=WebAppInfo(url=WEBAPP_URL.rstrip("/") + "/admin"),
                    )
                ]
            ]
        )
        await message.answer(text, reply_markup=keyboard)
        return
    hint = (WEBAPP_URL or "http://127.0.0.1:5173").rstrip("/") + "/admin"
    await message.answer(text + "\nBrauzerda: " + hint)
