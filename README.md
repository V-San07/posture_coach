# Posture Coach

A personal posture coaching app that uses your webcam to analyze posture in real time and provide feedback to help you maintain better alignment while working, studying, or moving.

## Features

- Real-time posture analysis using your webcam
- Instant feedback for neck, shoulder, and spine alignment
- Visual posture score with status indicators
- Session tracking and summary reports
- Posture alert after sustained poor posture
- Simple posture guide for better habits

## Tech stack

- Frontend: React, TypeScript, Vite
- Backend: FastAPI, Python
- Data visualization: Recharts
- Media analysis: MediaPipe Tasks Vision

## Screenshots 

<img width="800" height="400" alt="posture_coach1" src="https://github.com/user-attachments/assets/e0ae6d09-f752-4433-a043-2f76c147fb69" /><br><br><br>
<img width="800" height="400" alt="posture_coach2" src="https://github.com/user-attachments/assets/5274088c-16c7-466b-992e-5b5c83244d69" /><br><br><br>
<img width="500" height="300" alt="posture_coach3" src="https://github.com/user-attachments/assets/5482c338-da9f-4565-8a70-c958bf272f05" />&emsp;
<img width="370" height="300" alt="Screenshot 2026-08-06 001452" src="https://github.com/user-attachments/assets/d0b5e671-b9e8-4d80-a902-d6ac14050d9e" />

## Installation

### Frontend

```bash
cd frontend
npm install
```

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## How to run

### Start the backend

```bash
cd backend
uvicorn main:app --reload
```

The API will be available at http://localhost:8000.

### Start the frontend

```bash
cd frontend
npm run dev
```

The app will open at http://localhost:5173.

## Folder structure

```text
posture_coach/
├── backend/
│   ├── main.py
│   ├── seed.py
│   └── posture.db
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
└── README.md
```

## Future improvements

- Add user accounts and saved posture history
- Support more detailed posture diagnostics
- Add reminders and coaching tips
- Improve the alert experience with richer UI and sound customization
- Add mobile-friendly and accessibility improvements

