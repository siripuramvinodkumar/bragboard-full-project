from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from db import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    department = Column(String, nullable=False)
    role = Column(String, default="employee")
    is_admin = Column(Boolean, default=False)
    
    # Updated: Added cascade to prevent "Failed to load shout-outs" error
    sent_shoutouts = relationship(
        "ShoutOut", 
        back_populates="sender", 
        cascade="all, delete-orphan"
    )
    received_shoutouts = relationship(
        "ShoutOutRecipient", 
        back_populates="recipient", 
        cascade="all, delete-orphan"
    )
    reactions = relationship(
        "Reaction", 
        back_populates="user", 
        cascade="all, delete-orphan"
    )
    comments = relationship(
        "Comment", 
        back_populates="user", 
        cascade="all, delete-orphan"
    )

class ShoutOut(Base):
    __tablename__ = "shoutouts"
    id = Column(Integer, primary_key=True, index=True)
    message = Column(Text, nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=func.now())
    is_reported = Column(Boolean, default=False)

    sender = relationship("User", back_populates="sent_shoutouts")
    
    # Updated: Ensure recipients, reactions, and comments are cleared when shoutout is deleted
    recipients = relationship("ShoutOutRecipient", back_populates="shoutout", cascade="all, delete-orphan")
    reactions = relationship("Reaction", back_populates="shoutout", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="shoutout", cascade="all, delete-orphan")

class ShoutOutRecipient(Base):
    __tablename__ = "shoutout_recipients"
    id = Column(Integer, primary_key=True, index=True)
    shoutout_id = Column(Integer, ForeignKey("shoutouts.id"))
    recipient_id = Column(Integer, ForeignKey("users.id"))
    
    shoutout = relationship("ShoutOut", back_populates="recipients")
    recipient = relationship("User", back_populates="received_shoutouts")

# ... (Reaction and Comment classes remain the same as your previous version)

class Reaction(Base):
    __tablename__ = "reactions"
    id = Column(Integer, primary_key=True, index=True)
    reaction_type = Column(String)
    user_id = Column(Integer, ForeignKey("users.id"))
    shoutout_id = Column(Integer, ForeignKey("shoutouts.id"))
    user = relationship("User", back_populates="reactions")
    shoutout = relationship("ShoutOut", back_populates="reactions")

class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True, index=True)
    text = Column(Text)
    user_id = Column(Integer, ForeignKey("users.id"))
    shoutout_id = Column(Integer, ForeignKey("shoutouts.id"))
    user = relationship("User", back_populates="comments")
    shoutout = relationship("ShoutOut", back_populates="comments")

class AdminLog(Base):
    __tablename__ = "admin_logs"
    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String)
    target_id = Column(Integer)
    target_type = Column(String)
    timestamp = Column(DateTime, default=func.now())