from db import SessionLocal
from models import ShoutOut
from datetime import datetime

db = SessionLocal()

# Fetch all shout-outs with null created_at
shoutouts = db.query(ShoutOut).filter(ShoutOut.created_at == None).all()

for s in shoutouts:
    s.created_at = datetime.utcnow()  # set current timestamp

db.commit()
db.close()

print(f"Updated {len(shoutouts)} shout-outs with missing created_at")
