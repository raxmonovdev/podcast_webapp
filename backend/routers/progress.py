from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.auth import get_current_user
from backend.database import get_db
from backend.models import Episode, Progress, User, now_utc
from backend.schemas import ProgressIn, ProgressOut

router = APIRouter()


@router.get("/progress/{episode_id}", response_model=ProgressOut)
def get_progress(
    episode_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    row = (
        db.query(Progress)
        .filter(Progress.user_id == user.id, Progress.episode_id == episode_id)
        .first()
    )
    seconds = row.position_seconds if row else 0
    return ProgressOut(episode_id=episode_id, position_seconds=seconds)


@router.post("/progress", response_model=ProgressOut)
def save_progress(
    body: ProgressIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    episode = db.query(Episode.id).filter(Episode.id == body.episode_id).first()
    if episode is None:
        raise HTTPException(status_code=404, detail="Epizod topilmadi")
    seconds = max(0, int(body.position_seconds))
    row = (
        db.query(Progress)
        .filter(Progress.user_id == user.id, Progress.episode_id == body.episode_id)
        .first()
    )
    if row is None:
        row = Progress(user_id=user.id, episode_id=body.episode_id, position_seconds=seconds)
        db.add(row)
    else:
        row.position_seconds = seconds
        row.updated_at = now_utc()
    db.commit()
    return ProgressOut(episode_id=body.episode_id, position_seconds=seconds)
