import { useRef, useEffect, useState } from "react";
import { usePose } from "./hooks/usePose";
import { analyzePosture } from "./utils/postureScore";
import PostureGuide from "./components/guide.tsx";
import PostureChart from "./components/PostureChart.tsx";
import "./App.css";

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  const [showSessionSummary, setShowSessionSummary] = useState(false);
  const { landmarksRef } = usePose(videoRef, canvasRef);

  const [postureResult, setPostureResult] = useState({
    score: 0,
    status: "good" as "good" | "bad",
    feedback: "Stand in front of the camera...",
    shoulderScore: 0,
    neckScore: 0,
    neckForward: false,
    shoulderAngle: false,
    spineScore: 0,
  });

  useEffect(() => {
    async function startCamera() {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    }
    startCamera();
  }, []);

  useEffect(() => {
      let tick = 0;
      console.log("effect triggered")

      const interval = setInterval(() => {
        const result = analyzePosture(landmarksRef.current);
        setPostureResult(result);

        tick++;

        if (tick % 10 === 0 && sessionActive) {
          const currentSessionId = sessionId ?? crypto.randomUUID();
          if (!sessionId) {
            setSessionId(currentSessionId);
          }

          fetch("http://localhost:8000/sessions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              session_id: currentSessionId,
              timestamp: new Date().toISOString(),
              score: result.score,
              status: result.status,
            }),
          }).catch((err) => console.error("Failed to send session data:", err));
        }
      }, 1000);
    
      return () => clearInterval(interval);

    }, [landmarksRef, sessionActive, sessionId]);

    function endSession(){
      fetch(`http://localhost:8000/sessions/${sessionId}`)
        .then((res) => res.json())
        .then((data) => {
          setSessionData(data);
          setShowSessionSummary(true);
          setSessionActive(false);
        })
        .catch((err) => console.error("Failed to fetch sessions", err));
    }

  return (
    <div className="app-shell">
      <div className="app-glow app-glow-left" />
      <div className="app-glow app-glow-right" />

      <main className="app-main">
        <section className="hero-card">
          <div className="hero-copy">
            <p className="eyebrow">Personal Posture Coach</p>
            <h1>Posture Coach</h1>
            <p>Maintain a balanced head position, open shoulders, and a neutral spine while you move.</p>
          </div>
          <div className={`status-pill ${postureResult.status === "good" ? "status-good" : "status-bad"}`}>
            <span className="status-dot" />
            <span>{postureResult.status === "good" ? "Balanced posture" : "Needs adjustment"}</span>
          </div>
        </section>

        <section className="dashboard-grid">
          <div className="camera-panel glass-card">
            <div className="card-header">
              <div>
                <h2>Live Camera</h2>
                <p>Realtime posture feedback</p>
              </div>
              <span className="live-badge">LIVE</span>
            </div>
            <div className="video-frame">
              <video ref={videoRef} autoPlay playsInline />
              <canvas ref={canvasRef} />
              <div className="video-overlay">Position yourself in frame</div>
            </div>
          </div>

          <div className="score-panel glass-card">
            <div className={`score-circle ${postureResult.status === "good" ? "score-good" : "score-bad"}`}>
              <span>{postureResult.score}</span>
            </div>
            <div className="score-meta">
              <p className="score-label">Overall Score</p>
              <p className="feedback-text">{postureResult.feedback}</p>
            </div>
            <div className="mt-4 flex flex-col items-start gap-3">
              <div className="flex flex-wrap mx-auto items-center gap-2">
                <button
                  className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
                  onClick={() => {if (sessionActive) { endSession() } else { setSessionActive(true); }}}
                >
                  {sessionActive ? "End Session" : "Start Session"}
                </button>
                {sessionActive ? (
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    Session active
                  </span>
                ) : null}
              </div>
              <div className="flex items-start gap-2 rounded-2xl border border-slate-700/80 bg-slate-800/50 px-3 py-2 text-sm text-slate-300">
                <span className="mt-0.5 text-base text-sky-400">ⓘ</span>
                <p className="leading-5">Starting a session tracks posture data in real time and shows a summary with your results when you end it.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="insights-grid">
          <article className="metric-card">
            <p className="metric-label">Head Position</p>
            <p className="metric-value">{postureResult.neckForward ? "Needs correction" : "Aligned"}</p>
          </article>
          <article className="metric-card">
            <p className="metric-label">Shoulders</p>
            <p className="metric-value">{postureResult.shoulderAngle ? "Needs correction" : "Aligned"}</p>
          </article>
          <article className="metric-card">
            <p className="metric-label">Spine</p>
            <p className="metric-value">{postureResult.spineScore < 60 ? "Needs correction" : "Aligned"}</p>
          </article>
        </section>

        <section className="guide-card glass-card rounded-md">
          <PostureGuide/>
        </section>

        <section className="chart-card glass-card">
          {/* <PostureChart /> */}
        </section>

        {showSessionSummary && sessionData ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4">
            <div className="relative w-full max-w-xl rounded-3xl border border-slate-700 bg-slate-900/95 p-6 shadow-2xl shadow-slate-950/40 backdrop-blur-lg text-slate-100">
              

              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold">Session Summary</h2>
                    <p className="text-sm text-slate-400">Review your latest posture session.</p>
                  </div>
                </div>

                <div className="grid gap-3 rounded-3xl bg-slate-950/80 p-4 text-slate-200 ring-1 ring-slate-700">
                <div className="flex justify-between text-sm text-slate-400">
                    <span>Date</span>
                    <span>{sessionData.date}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-400">
                    <span>Time Started</span>
                    <span>{sessionData.started}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-400">
                    <span>Time Ended</span>
                    <span>{sessionData.ended}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-400">
                    <span>Average Score</span>
                    <span>{sessionData.avg_score}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-400">
                    <span>Best Score</span>
                    <span>{sessionData.best_score}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-400">
                    <span>Worst Score</span>
                    <span>{sessionData.worst_score}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-400">
                    <span>Feedback</span>
                    <span>{sessionData.feedback}</span>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    className="rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
                    onClick={() => setShowSessionSummary(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}