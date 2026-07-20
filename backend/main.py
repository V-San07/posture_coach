
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dateutil.relativedelta import relativedelta
from datetime import datetime, date, timezone, timedelta
import sqlite3
import os

app = FastAPI()

# Allow React frontend to talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class Session(BaseModel):
    timestamp: str
    score: float
    status: str


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "posture.db")

# Initialize DB
def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            score REAL,
            status TEXT
        )
    """)
    conn.commit()
    conn.close()

init_db()

@app.get("/")
def root():
    return {"status": "Posture Coach API running"}

@app.get("/sessions")
def get_sessions():
    """Return all stored posture sessions as a JSON list.
    Each item includes `timestamp`, `score`, and `status`."""
    try:
        with sqlite3.connect(DB_PATH) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT timestamp, score, status FROM sessions ORDER BY timestamp ASC")
            rows = cursor.fetchall()
            sessions = [{"timestamp": row[0], "score": row[1], "status": row[2]} for row in rows]
            return sessions
    except Exception as e:
        return {"error": str(e)}

@app.post("/sessions")
def create_session(session: Session):
    try:
        with sqlite3.connect(DB_PATH) as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO sessions (timestamp, score, status)
                VALUES (?, ?, ?)
                """,
                (session.timestamp, session.score, session.status)
            )
            conn.commit()
    except Exception as e:
        return {"error": str(e)}
    return {"message": "Session saved successfuly "}

#uvicorn main:app --reload
