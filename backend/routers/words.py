from typing import List

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.auth import get_current_user
from backend.database import get_db
from backend.models import Episode, SavedWord, User
from backend.schemas import WordIn, WordOut

router = APIRouter()


@router.get("/words", response_model=List[WordOut])
def list_words(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = (
        db.query(SavedWord)
        .filter(SavedWord.user_id == user.id)
        .order_by(SavedWord.created_at.desc())
        .all()
    )
    return [
        WordOut(id=row.id, word=row.word, translation=row.translation or "", episode_id=row.episode_id)
        for row in rows
    ]


@router.post("/words", response_model=WordOut)
def save_word(
    body: WordIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    word = body.word.strip()
    if not word or len(word) > 80:
        raise HTTPException(status_code=400, detail="So'z noto'g'ri")
    episode = db.query(Episode.id).filter(Episode.id == body.episode_id).first()
    if episode is None:
        raise HTTPException(status_code=404, detail="Epizod topilmadi")

    # Bir epizoddagi bir xil so'z qayta saqlansa, tarjima yangilanadi.
    row = (
        db.query(SavedWord)
        .filter(
            SavedWord.user_id == user.id,
            SavedWord.episode_id == body.episode_id,
            func.lower(SavedWord.word) == word.lower(),
        )
        .first()
    )
    translation = (body.translation or "").strip()[:200]
    if row is None:
        row = SavedWord(user_id=user.id, word=word, translation=translation, episode_id=body.episode_id)
        db.add(row)
    else:
        row.translation = translation
    db.commit()
    db.refresh(row)
    return WordOut(id=row.id, word=row.word, translation=row.translation, episode_id=row.episode_id)


@router.delete("/words/{word_id}", status_code=204)
def delete_word(
    word_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    deleted = (
        db.query(SavedWord)
        .filter(SavedWord.id == word_id, SavedWord.user_id == user.id)
        .delete()
    )
    db.commit()
    if not deleted:
        raise HTTPException(status_code=404, detail="So'z topilmadi")
    return Response(status_code=204)
