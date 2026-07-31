
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timezone
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
    session_id: str
    timestamp: str
    score: float
    status: str


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "posture.db")


def normalize_timestamp(value: str) -> str:
    """Normalize incoming timestamps to a consistent UTC ISO 8601 string."""
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        parsed = datetime.now(timezone.utc)
    return parsed.astimezone(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

# Initialize DB
def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT,
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

@app.post("/sessions")
def create_session(session: Session):
    print("POST received:", session.session_id, session.timestamp)
    try:
        with sqlite3.connect(DB_PATH) as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO sessions (session_id, timestamp, score, status)
                VALUES (?, ?, ?, ?)
                """,
                (session.session_id, normalize_timestamp(session.timestamp), session.score, session.status)
            )
            conn.commit()
            cursor.execute("SELECT COUNT(*) FROM sessions")
            print("Rows in sessions:", cursor.fetchone()[0])
    except Exception as e:
        return {"error": str(e)}
    return {"message": "Session saved successfuly "}

@app.get("/sessions")
def get_sessions():
    """Return all stored posture sessions as a JSON list.
    Each item includes `timestamp`, `score`, and `status`."""
    try:
        with sqlite3.connect(DB_PATH) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT timestamp, score, status FROM sessions ORDER BY datetime(timestamp) ASC")
            rows = cursor.fetchall()
            sessions = [{"timestamp": row[0], "score": row[1], "status": row[2]} for row in rows]
            return sessions
    except Exception as e:
        return {"error": str(e)}

@app.get("/sessions/{session_id}")
def get_session(session_id: str):
    """Return a specific posture session by its session_id."""
    try:
        with sqlite3.connect(DB_PATH) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT timestamp, score, status FROM sessions WHERE session_id = ?", (session_id,))
            rows = cursor.fetchall()
            if rows:
                avg_score = round(sum(r[1] for r in rows) / len(rows), 2)
                best_score = max(r[1] for r in rows)
                worst_score = min(r[1] for r in rows)
                
                if avg_score >= 90:
                    feedback = "Excellent posture throughout the session. Keep it up!"
                elif avg_score >= 75:
                    feedback = "Good posture for most of the session. Aim for consistency."
                elif avg_score >= 60:
                    feedback = "You're doing okay! Focus on maintaining better alignment."
                elif avg_score >= 50:
                    feedback = "Good posture overall. There's room for improvement."
                else:
                    feedback = "Poor posture detected for much of the session. Consider adjusting your chair and monitor height."

                return {"date": rows[0][0][:10], "started": datetime.fromisoformat(rows[0][0]).astimezone(None).strftime("%H:%M:%S"), "ended": datetime.fromisoformat(rows[-1][0]).astimezone(None).strftime("%H:%M:%S"), "avg_score": avg_score, "best_score": best_score, "worst_score": worst_score, "feedback": feedback}
            else:
                return {"error": "Session not found"}
    except Exception as e:
        return {"error": str(e)}

#uvicorn main:app --reload
