from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from backend.auth import get_current_user
from backend.database import get_db
from backend.models import Category, Episode, Favorite, Podcast, User
from backend.schemas import CategoryOut, EpisodeOut, PodcastOut, episode_out, podcast_out

router = APIRouter()
LEVELS = ("A1", "A2", "B1", "B2", "C1")


def check_level(level):
    if level is not None and level not in LEVELS:
        raise HTTPException(status_code=400, detail="Daraja noto'g'ri")


def favorite_ids(db: Session, user_id: int):
    rows = db.query(Favorite.podcast_id).filter(Favorite.user_id == user_id).all()
    return {row[0] for row in rows}


def episode_counts(db: Session):
    rows = db.query(Episode.podcast_id, func.count(Episode.id)).group_by(Episode.podcast_id).all()
    return {podcast_id: count for podcast_id, count in rows}


@router.get("/categories", response_model=List[CategoryOut])
def list_categories(db: Session = Depends(get_db), _user: User = Depends(get_current_user)):
    rows = db.query(Category).order_by(Category.name).all()
    return [CategoryOut(id=row.id, name=row.name) for row in rows]


@router.get("/podcasts", response_model=List[PodcastOut])
def list_podcasts(
    category: Optional[int] = Query(default=None),
    level: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    check_level(level)
    query = db.query(Podcast).options(joinedload(Podcast.category))
    if category is not None:
        query = query.filter(Podcast.category_id == category)
    if level is not None:
        query = query.filter(Podcast.level == level)
    if search and search.strip():
        term = "%" + search.strip() + "%"
        query = query.filter(or_(Podcast.title.ilike(term), Podcast.author.ilike(term)))
    podcasts = query.all()
    saved = favorite_ids(db, user.id)
    counts = episode_counts(db)
    # Ko'p sevimlilanganlari oldinda. Teng bo'lsa, yangirog'i.
    fav_counts = favorite_counts(db)
    podcasts.sort(key=lambda item: (fav_counts.get(item.id, 0), item.created_at or 0), reverse=True)
    return [podcast_out(item, saved, counts) for item in podcasts]


def favorite_counts(db: Session):
    rows = db.query(Favorite.podcast_id, func.count(Favorite.id)).group_by(Favorite.podcast_id).all()
    return {podcast_id: count for podcast_id, count in rows}


@router.get("/podcasts/{podcast_id}", response_model=PodcastOut)
def get_podcast(
    podcast_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    podcast = (
        db.query(Podcast)
        .options(joinedload(Podcast.category))
        .filter(Podcast.id == podcast_id)
        .first()
    )
    if podcast is None:
        raise HTTPException(status_code=404, detail="Podcast topilmadi")
    return podcast_out(podcast, favorite_ids(db, user.id), episode_counts(db))


@router.get("/podcasts/{podcast_id}/episodes", response_model=List[EpisodeOut])
def list_episodes(
    podcast_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    exists = db.query(Podcast.id).filter(Podcast.id == podcast_id).first()
    if exists is None:
        raise HTTPException(status_code=404, detail="Podcast topilmadi")
    rows = (
        db.query(Episode)
        .options(joinedload(Episode.podcast))
        .filter(Episode.podcast_id == podcast_id)
        .order_by(Episode.created_at.asc(), Episode.id.asc())
        .all()
    )
    return [episode_out(row) for row in rows]


@router.get("/episodes/latest", response_model=List[EpisodeOut])
def latest_episodes(
    category: Optional[int] = Query(default=None),
    level: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    check_level(level)
    query = db.query(Episode).options(joinedload(Episode.podcast))
    if category is not None:
        query = query.filter(Episode.podcast.has(Podcast.category_id == category))
    if level is not None:
        query = query.filter(Episode.podcast.has(Podcast.level == level))
    rows = query.order_by(Episode.created_at.desc()).limit(8).all()
    return [episode_out(row) for row in rows]


@router.get("/search")
def search(
    q: str = Query(default=""),
    level: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Nom bo'yicha podcast va epizod. Daraja ixtiyoriy filtr."""
    check_level(level)
    text = q.strip()
    podcast_query = db.query(Podcast).options(joinedload(Podcast.category))
    episode_query = db.query(Episode).options(joinedload(Episode.podcast))
    if level is not None:
        podcast_query = podcast_query.filter(Podcast.level == level)
        episode_query = episode_query.filter(Episode.podcast.has(Podcast.level == level))
    if text:
        term = "%" + text + "%"
        podcast_query = podcast_query.filter(or_(Podcast.title.ilike(term), Podcast.author.ilike(term)))
        episode_query = episode_query.filter(Episode.title.ilike(term))
    elif level is None:
        return {"podcasts": [], "episodes": []}

    saved = favorite_ids(db, user.id)
    counts = episode_counts(db)
    podcasts = podcast_query.order_by(Podcast.title).limit(20).all()
    episodes = episode_query.order_by(Episode.title).limit(20).all()
    return {
        "podcasts": [podcast_out(item, saved, counts) for item in podcasts],
        "episodes": [episode_out(item) for item in episodes],
    }
