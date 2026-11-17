"""Botni ishga tushirish.

Loyiha ildizidan:
    python bot/main.py
"""

import asyncio
import sys
from pathlib import Path

from aiogram import Bot, Dispatcher

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

# `python bot/main.py` da handlers shu papkadan topiladi.
sys.path.insert(0, str(Path(__file__).resolve().parent))

from backend.config import BOT_TOKEN
from handlers import router


async def main():
    if not BOT_TOKEN:
        print("BOT_TOKEN .env faylida yo'q. BotFather dan token olib, .env ga yozing.")
        return

    dispatcher = Dispatcher()
    dispatcher.include_router(router)

    # Telegram serveri javob bermasa jarayon o'lib, tunnel manzili o'zgarmasin.
    while True:
        bot = Bot(BOT_TOKEN)
        try:
            print("Telegramga ulanilmoqda...")
            await dispatcher.start_polling(bot)
            return
        except Exception as exc:
            print("Telegram javob bermadi (%s). 15 soniyadan so'ng qayta uriniladi." % type(exc).__name__)
            await bot.session.close()
            await asyncio.sleep(15)


if __name__ == "__main__":
    asyncio.run(main())
