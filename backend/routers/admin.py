from typing import List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from backend.auth import get_current_user, is_admin
from backend.database import get_db
from backend.models import Category, Episode, Favorite, Podcast, Progress, SavedWord, User
from backend.routers.podcasts import LEVELS

router = APIRouter(prefix="/admin")


class PodcastIn(BaseModel):
    title: str
    author: str
    description: str = ""
    cover_url: str = ""
    category_id: int
    level: str


class EpisodeIn(BaseModel):
    title: str
    description: str = ""
    audio_url: str
    duration: int = 0
    transcript: str = ""


class EpisodeAdminOut(BaseModel):
    id: int
    title: str
    audio_url: str
    duration: int
    transcript: str


class PodcastAdminOut(BaseModel):
    id: int
    title: str
    author: str
    description: str
    cover_url: str
    category_id: int
    category_name: str
    level: str
    episodes: List[EpisodeAdminOut]


class TopPodcast(BaseModel):
    id: int
    title: str
    listens: int


class StatsOut(BaseModel):
    user_count: int
    top_podcasts: List[TopPodcast]


def require_admin(user: User = Depends(get_current_user)) -> User:
    if not is_admin(user):
        raise HTTPException(status_code=403, detail="Bu bo'lim faqat admin uchun.")
    return user


def clean(value: str) -> str:
    return (value or "").strip()


def podcast_admin_out(podcast: Podcast) -> PodcastAdminOut:
    episodes = sorted(podcast.episodes, key=lambda item: item.id)
    return PodcastAdminOut(
        id=podcast.id,
        title=podcast.title,
        author=podcast.author,
        description=podcast.description or "",
        cover_url=podcast.cover_url or "",
        category_id=podcast.category_id,
        category_name=podcast.category.name if podcast.category else "",
        level=podcast.level,
        episodes=[
            EpisodeAdminOut(
                id=item.id,
                title=item.title,
                audio_url=item.audio_url,
                duration=item.duration or 0,
                transcript=item.transcript or "",
            )
            for item in episodes
        ],
    )


@router.get("/stats", response_model=StatsOut)
def stats(db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    user_count = db.query(func.count(User.id)).scalar() or 0
    # Har bir progress yozuvi — foydalanuvchi epizodni ochgani.
    rows = (
        db.query(Podcast.id, Podcast.title, func.count(Progress.id))
        .join(Episode, Episode.podcast_id == Podcast.id)
        .join(Progress, Progress.episode_id == Episode.id)
        .group_by(Podcast.id)
        .order_by(func.count(Progress.id).desc())
        .limit(5)
        .all()
    )
    return StatsOut(
        user_count=user_count,
        top_podcasts=[TopPodcast(id=row[0], title=row[1], listens=row[2]) for row in rows],
    )


@router.get("/podcasts", response_model=List[PodcastAdminOut])
def list_podcasts(db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    rows = (
        db.query(Podcast)
        .options(joinedload(Podcast.category), joinedload(Podcast.episodes))
        .order_by(Podcast.created_at.desc())
        .all()
    )
    # joinedload epizodni takrorlashi mumkin. id bo'yicha bittasini qoldiramiz.
    unique = []
    seen = set()
    for row in rows:
        if row.id in seen:
            continue
        seen.add(row.id)
        unique.append(podcast_admin_out(row))
    return unique


@router.post("/podcasts", response_model=PodcastAdminOut)
def create_podcast(
    body: PodcastIn,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    title = clean(body.title)
    author = clean(body.author)
    if not title or not author:
        raise HTTPException(status_code=400, detail="Nom va muallif kerak.")
    if body.level not in LEVELS:
        raise HTTPException(status_code=400, detail="Daraja noto'g'ri")
    category = db.query(Category).filter(Category.id == body.category_id).first()
    if category is None:
        raise HTTPException(status_code=400, detail="Kategoriya topilmadi.")
    podcast = Podcast(
        title=title,
        author=author,
        description=clean(body.description),
        cover_url=clean(body.cover_url) or "/covers/life.svg",
        category_id=category.id,
        level=body.level,
    )
    db.add(podcast)
    db.commit()
    db.refresh(podcast)
    podcast.category = category
    podcast.episodes = []
    return podcast_admin_out(podcast)


@router.delete("/podcasts/{podcast_id}", status_code=204)
def delete_podcast(
    podcast_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    podcast = db.query(Podcast).filter(Podcast.id == podcast_id).first()
    if podcast is None:
        raise HTTPException(status_code=404, detail="Podcast topilmadi.")
    episode_ids = [row[0] for row in db.query(Episode.id).filter(Episode.podcast_id == podcast_id).all()]
    if episode_ids:
        db.query(Progress).filter(Progress.episode_id.in_(episode_ids)).delete(synchronize_session=False)
        db.query(SavedWord).filter(SavedWord.episode_id.in_(episode_ids)).update(
            {SavedWord.episode_id: None},
            synchronize_session=False,
        )
        db.query(Episode).filter(Episode.id.in_(episode_ids)).delete(synchronize_session=False)
    db.query(Favorite).filter(Favorite.podcast_id == podcast_id).delete(synchronize_session=False)
    db.delete(podcast)
    db.commit()


@router.post("/podcasts/{podcast_id}/episodes", response_model=EpisodeAdminOut)
def create_episode(
    podcast_id: int,
    body: EpisodeIn,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    podcast = db.query(Podcast).filter(Podcast.id == podcast_id).first()
    if podcast is None:
        raise HTTPException(status_code=404, detail="Podcast topilmadi.")
    title = clean(body.title)
    audio = clean(body.audio_url)
    if not title or not audio:
        raise HTTPException(status_code=400, detail="Epizod nomi va audio manzili kerak.")
    if not audio.startswith("http://") and not audio.startswith("https://"):
        raise HTTPException(status_code=400, detail="Audio manzili http bilan boshlanishi kerak.")
    if body.duration < 0:
        raise HTTPException(status_code=400, detail="Davomiylik noto'g'ri")
    episode = Episode(
        podcast_id=podcast.id,
        title=title,
        description=clean(body.description),
        audio_url=audio,
        duration=body.duration,
        transcript=clean(body.transcript),
    )
    db.add(episode)
    db.commit()
    db.refresh(episode)
    return EpisodeAdminOut(
        id=episode.id,
        title=episode.title,
        audio_url=episode.audio_url,
        duration=episode.duration or 0,
        transcript=episode.transcript or "",
    )


@router.delete("/episodes/{episode_id}", status_code=204)
def delete_episode(
    episode_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    episode = db.query(Episode).filter(Episode.id == episode_id).first()
    if episode is None:
        raise HTTPException(status_code=404, detail="Epizod topilmadi.")
    db.query(Progress).filter(Progress.episode_id == episode_id).delete(synchronize_session=False)
    db.query(SavedWord).filter(SavedWord.episode_id == episode_id).update(
        {SavedWord.episode_id: None},
        synchronize_session=False,
    )
    db.delete(episode)
    db.commit()
