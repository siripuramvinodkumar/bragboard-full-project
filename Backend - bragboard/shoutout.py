from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from db import Base

class ShoutOut(Base):
    __tablename__ = "shoutouts"
    __table_args__ = {"extend_existing": True}  # <--- add this

    id = Column(Integer, primary_key=True)
    sender_id = Column(Integer, ForeignKey("users.id"))
    message = Column(String)
    created_at = Column(DateTime, default=func.now())
    recipients = relationship("ShoutOutRecipient", back_populates="shoutout")
    sender = relationship("User", back_populates="sent_shoutouts")


class ShoutOutRecipient(Base):
    __tablename__ = "shoutout_recipients"
    id = Column(Integer, primary_key=True)
    shoutout_id = Column(Integer, ForeignKey("shoutouts.id"))
    recipient_id = Column(Integer, ForeignKey("users.id"))

    shoutout = relationship("ShoutOut", back_populates="recipients")
    recipient = relationship("User")

