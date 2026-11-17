from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker

from backend.config import database_url

url = database_url()
connect_args = {"check_same_thread": False} if url.startswith("sqlite") else {}
engine = create_engine(url, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


@event.listens_for(engine, "connect")
def enable_foreign_keys(dbapi_connection, _connection_record):
    # SQLite chet kalitni o'zi yoqmaydi. Podcast o'chsa, epizodlari ham ketishi uchun.
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
