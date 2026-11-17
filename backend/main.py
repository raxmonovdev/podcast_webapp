from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.auth import get_current_user, is_admin
from backend.database import Base, engine
from backend.models import User
from backend.routers import admin, favorites, podcasts, progress, words
from backend.schemas import UserOut


@asynccontextmanager
async def lifespan(_app):
    # Jadval yo'q bo'lsa, server ochilganda yaratiladi.
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="English Podcast", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(podcasts.router)
app.include_router(favorites.router)
app.include_router(progress.router)
app.include_router(words.router)
app.include_router(admin.router)


@app.post("/auth", response_model=UserOut)
def auth(user: User = Depends(get_current_user)):
    return UserOut(
        id=user.id,
        telegram_id=user.telegram_id,
        first_name=user.first_name,
        username=user.username,
        is_admin=is_admin(user),
    )
