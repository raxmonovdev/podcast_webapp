from datetime import datetime, timezone

from sqlalchemy import BigInteger, Column, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship

from backend.database import Base


def now_utc():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    telegram_id = Column(BigInteger, unique=True, index=True, nullable=False)
    first_name = Column(String(128), nullable=False, default="")
    username = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=now_utc, nullable=False)

    favorites = relationship("Favorite", back_populates="user")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True)
    name = Column(String(80), unique=True, nullable=False)

    podcasts = relationship("Podcast", back_populates="category")


class Podcast(Base):
    __tablename__ = "podcasts"

    id = Column(Integer, primary_key=True)
    title = Column(String(200), nullable=False)
    author = Column(String(120), nullable=False)
    description = Column(Text, nullable=False, default="")
    cover_url = Column(String(300), nullable=False, default="")
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    # A1, A2, B1, B2 yoki C1. O'rganuvchi darajasi.
    level = Column(String(2), nullable=False, default="A1")
    created_at = Column(DateTime, default=now_utc, nullable=False)

    category = relationship("Category", back_populates="podcasts")
    episodes = relationship("Episode", back_populates="podcast", cascade="all, delete-orphan")


class Episode(Base):
    __tablename__ = "episodes"

    id = Column(Integer, primary_key=True)
    podcast_id = Column(Integer, ForeignKey("podcasts.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False, default="")
    audio_url = Column(String(500), nullable=False)
    duration = Column(Integer, nullable=False, default=0)
    transcript = Column(Text, nullable=False, default="")
    created_at = Column(DateTime, default=now_utc, nullable=False)

    podcast = relationship("Podcast", back_populates="episodes")


class Favorite(Base):
    __tablename__ = "favorites"
    __table_args__ = (UniqueConstraint("user_id", "podcast_id", name="uq_user_podcast"),)

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    podcast_id = Column(Integer, ForeignKey("podcasts.id", ondelete="CASCADE"), nullable=False, index=True)

    user = relationship("User", back_populates="favorites")
    podcast = relationship("Podcast")


class Progress(Base):
    __tablename__ = "progress"
    __table_args__ = (UniqueConstraint("user_id", "episode_id", name="uq_user_episode_progress"),)

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    episode_id = Column(Integer, ForeignKey("episodes.id", ondelete="CASCADE"), nullable=False, index=True)
    position_seconds = Column(Integer, nullable=False, default=0)
    updated_at = Column(DateTime, default=now_utc, nullable=False)


class SavedWord(Base):
    __tablename__ = "saved_words"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    word = Column(String(80), nullable=False)
    translation = Column(String(200), nullable=False, default="")
    episode_id = Column(Integer, ForeignKey("episodes.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=now_utc, nullable=False)
