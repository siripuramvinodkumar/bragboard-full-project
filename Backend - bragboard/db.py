from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# SQLite database
SQLALCHEMY_DATABASE_URL = "sqlite:///./bragboard.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}  # SQLite only
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

# ✅ THIS WAS MISSING
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
