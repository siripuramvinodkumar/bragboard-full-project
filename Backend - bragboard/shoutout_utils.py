from sqlalchemy.orm import Session, joinedload
from models import ShoutOut, ShoutOutRecipient, User # Added User import

def create_shoutout(db: Session, message: str, sender_id: int, recipient_ids: list):
    shoutout = ShoutOut(message=message, sender_id=sender_id)
    db.add(shoutout)
    db.commit()
    db.refresh(shoutout)

    for rid in set(recipient_ids):
        if rid != sender_id:
            db.add(
                ShoutOutRecipient(
                    shoutout_id=shoutout.id,
                    recipient_id=rid,
                )
            )

    db.commit()
    return shoutout

from sqlalchemy.orm import Session, joinedload
# Add Comment and User to this import list
from models import ShoutOut, ShoutOutRecipient, User, Comment 

def get_shoutouts(db: Session, department=None, sender_id=None, from_date=None, to_date=None, include_reported=True):
    query = (
        db.query(ShoutOut)
        .options(
            joinedload(ShoutOut.sender),
            joinedload(ShoutOut.recipients).joinedload(ShoutOutRecipient.recipient),
            joinedload(ShoutOut.reactions),
            joinedload(ShoutOut.comments).joinedload(Comment.user) 
        )
    )

    if department:
        # Check if department is a list (Multi-filter) or a single string
        query = query.join(User, ShoutOut.sender_id == User.id)
        if isinstance(department, list):
            query = query.filter(User.department.in_(department))
        else:
            query = query.filter(User.department == department)

    if sender_id:
        query = query.filter(ShoutOut.sender_id == sender_id)
    if from_date:
        query = query.filter(ShoutOut.created_at >= from_date)
    if to_date:
        query = query.filter(ShoutOut.created_at <= to_date)
    
    if not include_reported:
        query = query.filter(ShoutOut.is_reported == False)

    return query.order_by(ShoutOut.created_at.desc()).all()

def get_user_shoutouts(db: Session, user_id: int):
    return (
        db.query(ShoutOut)
        .options(
            joinedload(ShoutOut.sender),
            joinedload(ShoutOut.recipients).joinedload(ShoutOutRecipient.recipient),
        )
        .filter(
            (ShoutOut.sender_id == user_id) | 
            (ShoutOut.recipients.any(ShoutOutRecipient.recipient_id == user_id))
        )
        .order_by(ShoutOut.created_at.desc())
        .all()
    )