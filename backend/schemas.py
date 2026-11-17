from typing import Optional

from pydantic import BaseModel, ConfigDict


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    telegram_id: int
    first_name: str
    username: Optional[str] = None
    is_admin: bool = False


class CategoryOut(BaseModel):
    id: int
    name: str


class PodcastOut(BaseModel):
    id: int
    title: str
    author: str
    description: str
    cover_url: str
    category_id: int
    category_name: str
    level: str
    is_favorite: bool
    episode_count: int


class EpisodeOut(BaseModel):
    id: int
    podcast_id: int
    title: str
    description: str
    audio_url: str
    duration: int
    transcript: str
    podcast_title: str
    podcast_level: str
    cover_url: str


class FavoriteIn(BaseModel):
    podcast_id: int


class ProgressIn(BaseModel):
    episode_id: int
    position_seconds: int


class ProgressOut(BaseModel):
    episode_id: int
    position_seconds: int


class WordIn(BaseModel):
    word: str
    translation: str = ""
    episode_id: int


class WordOut(BaseModel):
    id: int
    word: str
    translation: str
    episode_id: Optional[int] = None


def podcast_out(podcast, favorite_ids, episode_counts):
    category_name = podcast.category.name if podcast.category else ""
    return PodcastOut(
        id=podcast.id,
        title=podcast.title,
        author=podcast.author,
        description=podcast.description or "",
        cover_url=podcast.cover_url or "",
        category_id=podcast.category_id,
        category_name=category_name,
        level=podcast.level or "A1",
        is_favorite=podcast.id in favorite_ids,
        episode_count=episode_counts.get(podcast.id, 0),
    )


def episode_out(episode):
    podcast = episode.podcast
    return EpisodeOut(
        id=episode.id,
        podcast_id=episode.podcast_id,
        title=episode.title,
        description=episode.description or "",
        audio_url=episode.audio_url,
        duration=episode.duration or 0,
        transcript=episode.transcript or "",
        podcast_title=podcast.title if podcast else "",
        podcast_level=podcast.level if podcast else "",
        cover_url=podcast.cover_url if podcast else "",
    )
