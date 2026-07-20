import sqlite3
import os
from datetime import datetime, timedelta
import random

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "posture.db")

def generate_dummy_sessions(base_date, num_sessions, start_hour=7, end_hour=21):
    """Generate realistic dummy session data.
    
    Args:
        base_date: Starting date for session generation
        num_sessions: Number of sessions to generate
        start_hour: Start of daily time range (default: 7 AM)
        end_hour: End of daily time range (default: 9 PM)
    
    Returns:
        List of tuples (timestamp, score, status)
    """
    sessions = []
    
    for i in range(num_sessions):
        # Random time between start_hour and end_hour
        random_time = timedelta(
            hours=random.randint(start_hour, end_hour),
            minutes=random.randint(0, 59)
        )
        timestamp = (base_date + timedelta(days=i//2) + random_time).isoformat()
        
        # Generate posture scores (0-100)
        # Bias towards better scores (70-95) with some poor ones (30-70)
        if random.random() < 0.7:
            score = random.uniform(70, 95)
        else:
            score = random.uniform(30, 70)
        
        score = round(score, 2)
        
        # Determine status based on score
        if score >= 80:
            status = "excellent"
        elif score >= 60:
            status = "good"
        elif score >= 40:
            status = "needs_improvement"
        else:
            status = "poor"
        
        sessions.append((timestamp, score, status))
    
    return sessions

def seed_sessions(clear_db=False):
    """Generate and insert realistic dummy session data for the last 30 days.
    
    Args:
        clear_db: If True, clears existing sessions before inserting new ones
    """
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Clear existing sessions if requested
    if clear_db:
        cursor.execute("DELETE FROM sessions")
        conn.commit()
    
    # Generate dummy data for the last 30 days
    sessions = []
    base_date = datetime.now() - timedelta(days=30)
    
    sessions.extend(generate_dummy_sessions(base_date, 45))
    
    # Insert sessions
    cursor.executemany(
        """
        INSERT INTO sessions (timestamp, score, status)
        VALUES (?, ?, ?)
        """,
        sessions
    )
    conn.commit()
    conn.close()
    
    print(f"Seeded {len(sessions)} dummy sessions for last 30 days!")
    print(f"Sample sessions:")
    for session in sessions[:5]:
        print(f"   - {session[0]}: Score {session[1]} ({session[2]})")

def seed_last_24_hours():
    """Generate and insert dummy sessions for the last 24 hours."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    base_date = datetime.now() - timedelta(hours=24)
    sessions = generate_dummy_sessions(base_date, 8)  # ~8 sessions in 24 hours
    
    # Insert sessions
    cursor.executemany(
        """
        INSERT INTO sessions (timestamp, score, status)
        VALUES (?, ?, ?)
        """,
        sessions
    )
    conn.commit()
    conn.close()
    
    print(f"Seeded {len(sessions)} dummy sessions for last 24 hours!")
    print(f"Sample sessions:")
    for session in sessions[:3]:
        print(f"   - {session[0]}: Score {session[1]} ({session[2]})")

def seed_last_1_hour():
    """Generate and insert dummy sessions for the last 1 hour."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    base_date = datetime.now() - timedelta(hours=1)
    sessions = generate_dummy_sessions(base_date, 3)  # ~3 sessions in 1 hour
    
    # Insert sessions
    cursor.executemany(
        """
        INSERT INTO sessions (timestamp, score, status)
        VALUES (?, ?, ?)
        """,
        sessions
    )
    conn.commit()
    conn.close()
    
    print(f"Seeded {len(sessions)} dummy sessions for last 1 hour!")
    print(f"Sample sessions:")
    for session in sessions:
        print(f"   - {session[0]}: Score {session[1]} ({session[2]})")

if __name__ == "__main__":
    '''
    import sys
    
    if len(sys.argv) > 1:
        option = sys.argv[1].lower()
        if option == "24h":
            seed_last_24_hours()
        elif option == "1h":
            seed_last_1_hour()
        else:
            print("Usage: python seed.py [24h|1h]")
            print("  python seed.py       - Seed last 30 days (~45 sessions)")
            print("  python seed.py 24h   - Seed last 24 hours (~8 sessions)")
            print("  python seed.py 1h    - Seed last 1 hour (~3 sessions)")
    else:
        seed_sessions()
    '''
    print("Populating database with dummy sessions...\n")
    
    # Clear DB and seed last 30 days first
    seed_sessions(clear_db=True)
    print()
    
    # Then add 24h and 1h data
    seed_last_24_hours()
    print()
    seed_last_1_hour()
    
    print("\nAll dummy data populated successfully!")
