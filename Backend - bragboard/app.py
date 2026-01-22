import csv
import logging
from io import StringIO
from typing import Optional, List
from fastapi import FastAPI, Depends, HTTPException, status, Query, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, text

# Local Imports
from models import User, ShoutOut, Reaction, Comment, ShoutOutRecipient, AdminLog 
from db import engine, Base, get_db
from schemas import (
    Register, 
    ShoutOutCreate, 
    ReactionCreate, 
    ShoutOutResponse, 
    CommentCreate, 
    CommentResponse
)
from utils import hash_password
from auth import get_current_user, login_user
from shoutout_utils import create_shoutout, get_shoutouts

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Database
Base.metadata.create_all(bind=engine)

app = FastAPI(title="BragBoard API 🚀")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# 1. ADMIN ROUTES (Milestone 4)
# ==========================================
admin_router = APIRouter(prefix="/admin", tags=["Admin"])

@admin_router.get("/stats")
def get_admin_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # MILESTONE 4: Security check for admin access
    if not getattr(current_user, 'is_admin', False) and current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Not authorized as admin")

    # Total Shoutouts count
    total_shoutouts = db.query(ShoutOut).count()

    # Top Givers (Contributors)
    top_givers = (
        db.query(User.name, func.count(ShoutOut.id).label("count"))
        .join(ShoutOut, User.id == ShoutOut.sender_id)
        .group_by(User.id, User.name)
        .order_by(text("count DESC"))
        .limit(5).all()
    )

    # Most Tagged (Recognized)
    most_tagged = (
        db.query(User.name, func.count(ShoutOutRecipient.id).label("count"))
        .join(ShoutOutRecipient, User.id == ShoutOutRecipient.recipient_id)
        .group_by(User.id, User.name)
        .order_by(text("count DESC"))
        .limit(5).all()
    )

    # Departmental Engagement Stats
    dept_stats = (
        db.query(User.department, func.count(ShoutOut.id))
        .join(ShoutOut, User.id == ShoutOut.sender_id)
        .group_by(User.department).all()
    )

    # Moderation Queue
    reported_posts = db.query(ShoutOut).filter(ShoutOut.is_reported == True).all()

    return {
        "total_shoutouts": total_shoutouts,
        "top_givers": [{"name": r[0], "count": r[1]} for r in top_givers],
        "most_tagged": [{"name": r[0], "count": r[1]} for r in most_tagged],
        "department_stats": {dept: count for dept, count in dept_stats},
        "reported_posts": [{"id": p.id, "message": p.message, "sender": p.sender.name} for p in reported_posts]
    }

@admin_router.get("/export-csv")
def export_shoutouts_csv(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # 1. Security Check
    if not getattr(current_user, 'is_admin', False) and current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    # 2. Fetch all shoutouts
    shoutouts = db.query(ShoutOut).all()
    
    # 3. Create CSV in memory
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Sender", "Sender Dept", "Message", "Date", "Reported"])
    
    for s in shoutouts:
        # SAFETY CHECK: If sender was deleted, provide fallback text instead of crashing
        sender_name = s.sender.name if s.sender else "Deleted User"
        sender_dept = s.sender.department if s.sender else "N/A"
        
        writer.writerow([
            s.id, 
            sender_name, 
            sender_dept, 
            s.message, 
            s.created_at.strftime("%Y-%m-%d %H:%M") if s.created_at else "N/A", 
            "Yes" if s.is_reported else "No"
        ])
    
    # 4. Prepare for Streaming
    response_content = output.getvalue()
    output.close()
    
    return StreamingResponse(
        iter([response_content]), # Wrap in an iterator for StreamingResponse
        media_type="text/csv", 
        headers={"Content-Disposition": "attachment; filename=bragboard_report.csv"}
    )

@admin_router.delete("/shoutout/{shoutout_id}")
def delete_shoutout(shoutout_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not getattr(current_user, 'is_admin', False) and current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Unauthorized")

    shoutout = db.query(ShoutOut).filter(ShoutOut.id == shoutout_id).first()
    if not shoutout:
        raise HTTPException(status_code=404, detail="Shoutout not found")

    # Log action for audit trail
    log = AdminLog(admin_id=current_user.id, action="DELETED_SHOUTOUT", target_id=shoutout_id, target_type="shoutout")
    db.add(log)
    
    db.delete(shoutout)
    db.commit()
    return {"message": "Deleted successfully"}

@admin_router.put("/shoutout/{shoutout_id}/dismiss")
def dismiss_report(shoutout_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not getattr(current_user, 'is_admin', False) and current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    shoutout = db.query(ShoutOut).filter(ShoutOut.id == shoutout_id).first()
    if shoutout:
        shoutout.is_reported = False
        db.commit()
    return {"message": "Report dismissed"}

@admin_router.post("/users", status_code=201)
def admin_create_user(
    user_data: Register, 
    is_admin_flag: bool = False, # Caught from URL params: ?is_admin_flag=true
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # 1. Security Check: Only logged-in admins can access this
    if not getattr(current_user, 'is_admin', False):
        raise HTTPException(status_code=403, detail="Only admins can create users manually")

    # 2. Check if user already exists
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    # 3. Determine Role
    # It becomes an admin if the checkbox was ticked OR the secret was provided
    is_admin_user = is_admin_flag or (user_data.admin_secret == "SECRET2026")
    user_role = "admin" if is_admin_user else "employee"

    # 4. Create User
    new_user = User(
        name=user_data.name,
        email=user_data.email,
        password=hash_password(user_data.password), 
        department=user_data.department,
        role=user_role,
        is_admin=is_admin_user
    )
    
    db.add(new_user)
    
    # 5. Log the action in AdminLog
    log = AdminLog(
        admin_id=current_user.id, 
        action=f"CREATED_{user_role.upper()}", 
        target_type="user"
    )
    db.add(log)
    
    db.commit()
    return {"message": f"User {user_data.name} created successfully as {user_role}"}

@admin_router.delete("/users/{user_id}")
def admin_delete_user(
    user_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # 1. Security Check
    if not getattr(current_user, 'is_admin', False):
        raise HTTPException(status_code=403, detail="Admin only.")

    user_to_delete = db.query(User).filter(User.id == user_id).first()
    
    if not user_to_delete:
        raise HTTPException(status_code=404, detail="User not found.")
        
    # Prevent admin from deleting themselves
    if user_to_delete.id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own admin account.")

    # 2. Delete the user
    db.delete(user_to_delete)
    
    # 3. Log the action
    log = AdminLog(admin_id=current_user.id, action=f"DELETED_USER: {user_to_delete.email}")
    db.add(log)
    
    db.commit()
    return {"message": "User deleted successfully"}

app.include_router(admin_router)

# ==========================================
# 2. AUTHENTICATION
# ==========================================

@app.post("/register", status_code=201)
def register(user_data: Register, db: Session = Depends(get_db)):
    # 1. Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # 2. Logic for Admin Privileges
    is_admin_account = False
    if user_data.admin_secret == "SECRET2026":
        is_admin_account = True

    # 3. Create and Save User
    # Note: We use password= because that is the name in your User model
    new_user = User(
        name=user_data.name,
        email=user_data.email,
        password=hash_password(user_data.password), 
        department=user_data.department,
        is_admin=is_admin_account,
        role="admin" if is_admin_account else "employee"
    )
    
    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return {
            "message": "User created successfully", 
            "is_admin": new_user.is_admin
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )

@app.post("/login")
def login(token=Depends(login_user)):
    return token

@app.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return current_user

@app.get("/users")
def get_all_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    users = db.query(User).filter(User.id != current_user.id).all()
    return [{"id": u.id, "name": u.name, "department": u.department} for u in users]

# ==========================================
# 3. SHOUTOUTS, REACTIONS, & COMMENTS
# ==========================================

@app.post("/shoutouts", status_code=201)
def post_shoutout(
    shoutout: ShoutOutCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # 1. Validation must come BEFORE the return/create call
    if not shoutout.message or not shoutout.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    
    # 2. Now create the shoutout
    return create_shoutout(db, shoutout.message, current_user.id, shoutout.recipient_ids or [])

@app.get("/shoutouts")
def get_shoutouts_endpoint(
    depts: Optional[List[str]] = Query(None), 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # Fetch shoutouts from your utility function
    shoutouts_list = get_shoutouts(db, department=depts) 

    result = []
    for s in shoutouts_list:
        # SKIP shoutouts where the sender no longer exists (prevents frontend crash)
        if not s.sender:
            continue

        # Safe recipient extraction
        recipients = []
        for r in s.recipients:
            if r.recipient: # Safety check
                recipients.append({"id": r.recipient.id, "name": r.recipient.name})
        
        # Safe comments extraction
        comments_list = []
        for c in s.comments:
            comments_list.append({
                "id": c.id,
                "text": c.text,
                # If the user who commented was deleted, show "Unknown User"
                "user": {"id": c.user.id, "name": c.user.name} if c.user else {"name": "Deleted User"}
            })

        # Reaction counts
        reaction_counts = {"like": 0, "clap": 0, "star": 0}
        for r in s.reactions:
            if r.reaction_type in reaction_counts:
                reaction_counts[r.reaction_type] += 1

        # Build the final object
        result.append({
            "id": s.id,
            "message": s.message,
            "sender": s.sender.name,
            "sender_department": s.sender.department,
            "recipients": recipients,
            "comments": comments_list,
            "reactions": reaction_counts,
            "created_at": s.created_at,
            "is_reported": getattr(s, 'is_reported', False)
        })
        
    return result

@app.post("/shoutouts/{shoutout_id}/reactions")
def toggle_reaction(shoutout_id: int, reaction: ReactionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing = db.query(Reaction).filter(
        Reaction.shoutout_id == shoutout_id, 
        Reaction.user_id == current_user.id, 
        Reaction.reaction_type == reaction.reaction_type
    ).first()

    if existing:
        db.delete(existing)
        db.commit()
        return {"action": "removed"}

    new_rec = Reaction(reaction_type=reaction.reaction_type, user_id=current_user.id, shoutout_id=shoutout_id)
    db.add(new_rec)
    db.commit()
    return {"action": "added"}

@app.post("/shoutouts/{shoutout_id}/comments")
def add_comment(shoutout_id: int, comment_data: CommentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_comment = Comment(text=comment_data.text, user_id=current_user.id, shoutout_id=shoutout_id)
    db.add(new_comment)
    db.commit()
    # Return the comment with user info so the frontend can display it immediately
    return {
        "id": new_comment.id,
        "text": new_comment.text,
        "user": {"id": current_user.id, "name": current_user.name}
    }

@app.put("/shoutouts/{shoutout_id}/report")
def report_shoutout(shoutout_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # MILESTONE 4: Reporting content
    s = db.query(ShoutOut).filter(ShoutOut.id == shoutout_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Post not found")
    s.is_reported = True
    db.commit()
    return {"message": "Reported"}

@app.get("/")
def home():
    return {"message": "BragBoard API is running!"}

