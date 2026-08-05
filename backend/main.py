
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timezone, timedelta
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


def format_history_cutoff(delta: timedelta | None) -> str | None:
    """Format a cutoff timestamp in the same UTC format used for stored rows."""
    if delta is None:
        return None
    return (datetime.now(timezone.utc) - delta).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def get_history_limit(period: str) -> int | None:
    """Return a row limit for longer periods; short periods stay unbounded."""
    limits = {
        "10m": None,
        "1h": None,
        "24h": 90,
        "7d": 110,
        "30d": 120,
        "all": 129,
    }
    return limits.get(period)


def dedupe_history_by_minute(rows: list[dict]) -> list[dict]:
    """Keep only one score per minute for history chart display."""
    deduped = []
    seen_minutes = set()

    for row in rows:
        minute_key = row["timestamp"][:16]
        if minute_key not in seen_minutes:
            seen_minutes.add(minute_key)
            deduped.append(row)

    return deduped

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

@app.get("/sessions/history")
def get_session_history(period: str = "24h"):
    """Return posture score history for the selected time range."""
    allowed_periods = {"10m": timedelta(minutes=10), "1h": timedelta(hours=1), "24h": timedelta(hours=24), "7d": timedelta(days=7), "30d": timedelta(days=30), "all": None}

    if period not in allowed_periods:
        return {"error": "Invalid period"}

    cutoff = format_history_cutoff(allowed_periods[period])
    limit = get_history_limit(period)

    try:
        with sqlite3.connect(DB_PATH) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            if cutoff is None:
                query = "SELECT timestamp, score FROM sessions ORDER BY timestamp ASC"
                params = ()
            else:
                query = "SELECT timestamp, score FROM sessions WHERE timestamp >= ? ORDER BY timestamp ASC"
                params = (cutoff,)

            if limit is not None:
                query = f"{query} LIMIT ?"
                params = params + (limit,)

            cursor.execute(query, params)
            rows = [dict(row) for row in cursor.fetchall()]
            return {"history": dedupe_history_by_minute(rows)}
        
    except Exception as e:
        return {"errorsss": str(e)}

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
