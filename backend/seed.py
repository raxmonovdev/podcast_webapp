"""Inglizcha o'rganuvchi podcastlarini bazaga yozadi.

Eski baza yangi ustunlarni o'zi qo'shmaydi. Schema o'zgarganda:
    rm -f podcast.db
    python backend/seed.py
"""

import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.database import Base, SessionLocal, engine
from backend.models import Category, Episode, Podcast

# SoundHelix — ochiq sinov audiosi. Haqiqiy nutq emas, pleyerni tekshirish uchun.
def song(number, duration):
    return ("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-%s.mp3" % number, duration)


SONGS = [
    song(1, 559),
    song(2, 639),
    song(3, 516),
    song(4, 454),
    song(5, 531),
    song(6, 419),
    song(7, 631),
    song(8, 488),
    song(9, 584),
    song(10, 791),
    song(11, 827),
    song(12, 771),
]

CATEGORIES = [
    "Daily Life",
    "Travel",
    "Food & Cooking",
    "Movies & Music",
    "Technology",
    "Health & Fitness",
    "Stories",
    "Business English",
    "Culture",
]

# Har darajadan kamida bitta. Har podcastda ikkita qisqa epizod.
PODCASTS = [
    {
        "title": "Morning Routine",
        "author": "Emma Cole",
        "category": "Daily Life",
        "level": "A1",
        "cover_url": "/covers/life.svg",
        "description": "Simple English about a normal morning. Short sentences and everyday words.",
        "episodes": [
            ("Tea and Bread", "I wake up at seven. I drink tea and eat bread. Then I walk to school. The street is quiet."),
            ("My Bag", "I put a book in my bag. I take my keys. I close the door. I say goodbye to my family."),
        ],
    },
    {
        "title": "At the Market",
        "author": "Leo Park",
        "category": "Food & Cooking",
        "level": "A1",
        "cover_url": "/covers/family.svg",
        "description": "Buying food with easy words. Listen slowly and repeat the names of the food.",
        "episodes": [
            ("Apples", "I want three apples. The apples are red. How much are they? They are two dollars."),
            ("Soup", "I cook soup at home. I need water, carrots and salt. The soup is hot. I eat it with bread."),
        ],
    },
    {
        "title": "First Trip",
        "author": "Maya Singh",
        "category": "Travel",
        "level": "A2",
        "cover_url": "/covers/history.svg",
        "description": "A short trip told in clear English. Good for learners who know simple past.",
        "episodes": [
            ("The Ticket", "I bought a ticket yesterday. The train leaves at nine. I have a window seat. I feel a little nervous."),
            ("The Hotel", "The hotel is near the station. My room is small but clean. I ask for water. The receptionist smiles."),
        ],
    },
    {
        "title": "A Short Walk",
        "author": "Noah Bennett",
        "category": "Health & Fitness",
        "level": "A2",
        "cover_url": "/covers/life.svg",
        "description": "Easy advice about moving your body. No difficult medical words.",
        "episodes": [
            ("Twenty Minutes", "I walk for twenty minutes after lunch. I do not run. I breathe slowly and look at the trees."),
            ("Water", "I drink water before the walk. I wear comfortable shoes. After the walk I feel calm and awake."),
        ],
    },
    {
        "title": "After the Film",
        "author": "Sofia Alvarez",
        "category": "Movies & Music",
        "level": "B1",
        "cover_url": "/covers/family.svg",
        "description": "Two friends talk about a film. Useful phrases for opinions.",
        "episodes": [
            ("The Ending", "I liked the ending because it was honest. My friend wanted a happier finish. We talked about it on the way home."),
            ("The Song", "The song in the last scene stayed in my head. It was slow and a little sad. I looked for it after the film."),
        ],
    },
    {
        "title": "A Useful App",
        "author": "Kenji Mori",
        "category": "Technology",
        "level": "B1",
        "cover_url": "/covers/tech.svg",
        "description": "Everyday technology in plain English. Listen for sequence words like first and then.",
        "episodes": [
            ("Notes", "I keep my notes on my phone. First I write the idea. Then I add a date. Later I can find it quickly."),
            ("A Slow Page", "The page opened slowly this morning. I checked the wifi and tried again. The second time it worked."),
        ],
    },
    {
        "title": "Monday Meeting",
        "author": "Hannah Brooks",
        "category": "Business English",
        "level": "B2",
        "cover_url": "/covers/tech.svg",
        "description": "Polite language for a small team meeting. Focus on agreeing and asking for time.",
        "episodes": [
            ("The Agenda", "Could we start with the agenda? I would like to confirm the deadline before we discuss the budget."),
            ("A Delay", "I am afraid the report will be a day late. I can send a short summary today and the full version tomorrow."),
        ],
    },
    {
        "title": "City Festival",
        "author": "Amina Diallo",
        "category": "Culture",
        "level": "B2",
        "cover_url": "/covers/history.svg",
        "description": "A visitor describes a local festival. Notice how reasons and impressions are expressed.",
        "episodes": [
            ("The Square", "The square was full by evening. Families shared food, and a band played near the old gate. It felt welcoming rather than loud."),
            ("A Custom", "Someone explained that the lights are a wish for a good year. I did not know the custom, but the meaning was easy to feel."),
        ],
    },
    {
        "title": "The Rainy Station",
        "author": "Oliver Grant",
        "category": "Stories",
        "level": "C1",
        "cover_url": "/covers/history.svg",
        "description": "A short story with richer vocabulary. Pause often and save the words you want to keep.",
        "episodes": [
            ("The Platform", "Rain stitched the platform into a grey line. I had missed the earlier train and was left with a folded ticket and too much time to think."),
            ("A Stranger", "A stranger asked whether the delay would last. We traded uncertain guesses, then stood in a comfortable silence until the lights appeared down the track."),
        ],
    },
]


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(Podcast).first() is not None:
            print("Bazada podcastlar bor. Yangilash uchun podcast.db ni o'chirib, qayta ishga tushiring.")
            return

        base = datetime(2026, 10, 1, tzinfo=timezone.utc)
        categories = {}
        for name in CATEGORIES:
            row = Category(name=name)
            db.add(row)
            db.flush()
            categories[name] = row

        episode_total = 0
        song_index = 0
        for pod_index, item in enumerate(PODCASTS):
            podcast = Podcast(
                title=item["title"],
                author=item["author"],
                description=item["description"],
                cover_url=item["cover_url"],
                category_id=categories[item["category"]].id,
                level=item["level"],
                created_at=base + timedelta(days=len(PODCASTS) - pod_index),
            )
            db.add(podcast)
            db.flush()
            for ep_index, (title, transcript) in enumerate(item["episodes"]):
                url, duration = SONGS[song_index % len(SONGS)]
                song_index += 1
                db.add(
                    Episode(
                        podcast_id=podcast.id,
                        title=title,
                        description="Open test audio for the player. The transcript is the lesson text.",
                        audio_url=url,
                        duration=duration,
                        transcript=transcript,
                        created_at=base + timedelta(days=ep_index * 4, hours=pod_index),
                    )
                )
                episode_total += 1

        db.commit()
        print("Tayyor: %s ta podcast, %s ta epizod." % (len(PODCASTS), episode_total))
    finally:
        db.close()


if __name__ == "__main__":
    main()
