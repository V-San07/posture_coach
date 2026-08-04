# Posture Coach

A personal posture coaching app that uses your webcam to analyze posture in real time and provide feedback to help you maintain better alignment while working, studying, or moving.

## Demo screenshots

Screenshots will be added here once the app is showcased in a polished demo.

- Live posture feedback view
- Session summary with score history
- Posture guidance panel

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

