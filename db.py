import datetime
from pathlib import Path

from sqlalchemy import create_engine, Column, Integer, Float, String, DateTime, Text
from sqlalchemy.orm import declarative_base, sessionmaker

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "nexus_history.db"

engine = create_engine(f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()


class Generation(Base):
    __tablename__ = "generations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    prompt = Column(Text, nullable=False)
    negative_prompt = Column(Text, default="")
    seed = Column(Integer, nullable=False)
    steps = Column(Integer, nullable=False)
    guidance = Column(Float, nullable=False)
    model_name = Column(String(256), nullable=False)
    mode = Column(String(32), nullable=False, default="txt2img")
    image_path = Column(String(512), nullable=False)
    width = Column(Integer, default=1024)
    height = Column(Integer, default=1024)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def add_generation(prompt: str, negative_prompt: str, seed: int, steps: int,
                   guidance: float, model_name: str, mode: str,
                   image_path: str, width: int, height: int) -> int:
    db = SessionLocal()
    gen = Generation(
        prompt=prompt,
        negative_prompt=negative_prompt,
        seed=seed,
        steps=steps,
        guidance=guidance,
        model_name=model_name,
        mode=mode,
        image_path=image_path,
        width=width,
        height=height,
    )
    db.add(gen)
    db.commit()
    gen_id = gen.id
    db.close()
    return gen_id


def get_history(limit: int = 50, offset: int = 0) -> list[dict]:
    db = SessionLocal()
    rows = (
        db.query(Generation)
        .order_by(Generation.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    result = []
    for r in rows:
        result.append({
            "id": r.id,
            "prompt": r.prompt,
            "negative_prompt": r.negative_prompt,
            "seed": r.seed,
            "steps": r.steps,
            "guidance": r.guidance,
            "model_name": r.model_name,
            "mode": r.mode,
            "image_path": r.image_path,
            "width": r.width,
            "height": r.height,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        })
    db.close()
    return result
