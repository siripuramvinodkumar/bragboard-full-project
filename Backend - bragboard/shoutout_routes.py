from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from db import SessionLocal
from shoutout_utils import create_shoutout, get_user_shoutouts
from schemas import ShoutOutCreate, ShoutOutResponse, ReactionCreate
from auth import get_current_user
from models import Reaction, ShoutOut  # Added ShoutOut model import

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/shoutouts", response_model=ShoutOutResponse)
def post_shoutout(
    shoutout_data: ShoutOutCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    shoutout = create_shoutout(
        db,
        sender_id=current_user.id,
        message=shoutout_data.message,
        recipient_ids=shoutout_data.recipient_ids
    )
    # Ensure the object is fresh with its relationships
    db.refresh(shoutout)
    return shoutout

@router.get("/shoutouts", response_model=List[ShoutOutResponse])
def read_shoutouts(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    shoutouts = get_user_shoutouts(db, current_user.id)
    
    # Calculate counts before returning so the Frontend sees them
    for s in shoutouts:
        s.reaction_count = len(s.reactions) if hasattr(s, 'reactions') else 0
        
    return shoutouts

@router.post("/shoutouts/{shoutout_id}/reactions")
def add_reaction(
    shoutout_id: int,
    reaction: ReactionCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Check if shoutout exists first
    shoutout = db.query(ShoutOut).filter(ShoutOut.id == shoutout_id).first()
    if not shoutout:
        raise HTTPException(status_code=404, detail="Shoutout not found")

    new_reaction = Reaction(
        reaction_type=reaction.reaction_type,
        user_id=current_user.id,
        shoutout_id=shoutout_id
    )

    db.add(new_reaction)
    db.commit()
    return {"message": "Reaction added"}
