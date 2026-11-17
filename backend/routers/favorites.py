from typing import List

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session, joinedload

from backend.auth import get_current_user
from backend.database import get_db
from backend.models import Favorite, Podcast, User
from backend.routers.podcasts import episode_counts, favorite_ids
from backend.schemas import FavoriteIn, PodcastOut, podcast_out

router = APIRouter()


@router.get("/favorites", response_model=List[PodcastOut])
def list_favorites(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = (
        db.query(Podcast)
        .join(Favorite, Favorite.podcast_id == Podcast.id)
        .filter(Favorite.user_id == user.id)
        .options(joinedload(Podcast.category))
        .order_by(Favorite.id.desc())
        .all()
    )
    saved = favorite_ids(db, user.id)
    counts = episode_counts(db)
    return [podcast_out(row, saved, counts) for row in rows]


@router.post("/favorites")
def add_favorite(
    body: FavoriteIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    podcast = db.query(Podcast).filter(Podcast.id == body.podcast_id).first()
    if podcast is None:
        raise HTTPException(status_code=404, detail="Podcast topilmadi")
    exists = (
        db.query(Favorite)
        .filter(Favorite.user_id == user.id, Favorite.podcast_id == body.podcast_id)
        .first()
    )
    if exists is None:
        db.add(Favorite(user_id=user.id, podcast_id=body.podcast_id))
        db.commit()
    return {"ok": True}


@router.delete("/favorites/{podcast_id}", status_code=204)
def remove_favorite(
    podcast_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    db.query(Favorite).filter(
        Favorite.user_id == user.id,
        Favorite.podcast_id == podcast_id,
    ).delete()
    db.commit()
    return Response(status_code=204)
