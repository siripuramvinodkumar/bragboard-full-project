from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime

# 1. AUTH & USER CREATION
class Register(BaseModel):
    name: str
    email: str
    password: str
    department: str
    admin_secret: Optional[str] = None  # Add this to allow admin registration

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    department: str
    # Note: We don't need admin_secret here because the Admin 
    # is already authenticated when using the Dashboard.

# 3. COMMENT (Updated for Moderation)
class CommentCreate(BaseModel):
    text: str

class CommentResponse(BaseModel):
    id: int
    text: str
    user_id: int
    user: UserCreate
    created_at: datetime
    is_reported: bool = False # Added for moderation

    class Config:
        from_attributes = True

# 4. REACTION
class ReactionCreate(BaseModel):
    reaction_type: str  # "like", "clap", "star"

class ReactionCount(BaseModel):
    reaction_type: str
    count: int

# 5. RECIPIENT
class RecipientResponse(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

# 6. SHOUTOUT (Updated for Admin Analytics & Moderation)
class ShoutOutCreate(BaseModel):
    message: str
    recipient_ids: Optional[List[int]] = Field(default_factory=list)

class ShoutOutResponse(BaseModel):
    id: int
    message: str
    sender: str  
    sender_id: int # Useful for analytics
    recipients: List[RecipientResponse]
    created_at: datetime
    reactions: Dict[str, int] = {} 
    total_reactions: int = 0
    comments: List[CommentResponse] = []
    is_reported: bool = False # Added for moderation

    class Config:
        from_attributes = True

# 7. NEW: ADMIN ANALYTICS SCHEMA
class AdminStats(BaseModel):
    total_shoutouts: int
    top_contributors: List[Dict] # e.g. [{"name": "Alice", "count": 10}]
    most_tagged: List[Dict]
    department_stats: Dict[str, int]

