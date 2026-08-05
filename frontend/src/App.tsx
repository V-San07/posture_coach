import { useRef, useEffect, useState } from "react";
import { usePose } from "./hooks/usePose";
import { analyzePosture } from "./utils/postureScore";
import PostureGuide from "./components/guide.tsx";
import PostureHistoryChart from "./components/PostureHistoryChart";
import "./App.css";

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  const [showSessionSummary, setShowSessionSummary] = useState(false);
  const [badPostureAlertVisible, setBadPostureAlertVisible] = useState(false);
  const { landmarksRef } = usePose(videoRef, canvasRef);
  const badPostureStartRef = useRef<number | null>(null);
  const alertTriggeredRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);

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

  const playAlertSound = () => {
    const AudioContextCtor = window.AudioContext || (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextCtor) {
      return;
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextCtor();
    }

    const context = audioContextRef.current;
    if (context.state === "suspended") {
      void context.resume();
    }

    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(440, context.currentTime + 0.45);
    gainNode.gain.setValueAtTime(0.12, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.6);

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.6);
  };

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
    const enableAudio = () => {
      if (audioContextRef.current?.state === "suspended") {
        void audioContextRef.current.resume();
      }
    };

    window.addEventListener("pointerdown", enableAudio);
    window.addEventListener("keydown", enableAudio);

    return () => {
      window.removeEventListener("pointerdown", enableAudio);
      window.removeEventListener("keydown", enableAudio);
    };
  }, []);

  useEffect(() => {
      let tick = 0;
      console.log("effect triggered")

      const interval = setInterval(() => {
        const result = analyzePosture(landmarksRef.current);
        setPostureResult(result);

        if (result.status === "bad") {
          if (badPostureStartRef.current === null) {
            badPostureStartRef.current = Date.now();
            alertTriggeredRef.current = false;
          }

          const elapsedBadPostureMs = Date.now() - badPostureStartRef.current;
          if (elapsedBadPostureMs >= 45000 && !alertTriggeredRef.current) {
            alertTriggeredRef.current = true;
            setBadPostureAlertVisible(true);
            playAlertSound();
          }
        } else {
          badPostureStartRef.current = null;
          alertTriggeredRef.current = false;
          setBadPostureAlertVisible(false);
        }

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
        {badPostureAlertVisible ? (
          <div className="posture-alert-overlay" role="alert" aria-live="assertive">
            <div className="posture-alert-card">
              <p className="alert-label">Posture alert</p>
              <h2>Adjust your position</h2>
              <p>You have been holding a poor posture for over 45 seconds. Reset your shoulders and spine to keep your form balanced.</p>
            </div>
          </div>
        ) : null}

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
                  className="rounded-xl bg-[#3dcdd2] px-4 py-2 text-sm font-semibold !text-[#020202] transition hover:bg-[#2ecdf0] border border-[#42F2F7]/40 shadow-lg shadow-[#42F2F7]/10"
                  onClick={() => {if (sessionActive) { endSession() } else { setSessionActive(true); }}}
                >
                  {sessionActive ? "End Session" : "Start Session"}
                </button>
                {sessionActive ? (
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#FE4A49]/40 bg-[#FE4A49]/15 px-3 py-1 text-xs font-medium text-[#FE4A49]">
                    <span className="h-2 w-2 rounded-full bg-[#FE4A49]" />
                    Session active
                  </span>
                ) : null}
              </div>
              <div className="flex items-start gap-2 rounded-2xl border border-[#8491A3]/50 bg-[#020202]/75 px-3 py-2 text-sm text-[#8c9cb2]">
                <span className="mt-0.5 text-base !text-[#73a1f0]">ⓘ</span>
                <p className="leading-5 !text-[#909db3]">Starting a session tracks posture data in real time and shows a summary with your results when you end it.</p>
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
          <PostureHistoryChart />
        </section>

        {showSessionSummary && sessionData ? (
          <div className="session-summary-backdrop">
            <div className="session-summary-panel">
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="summary-heading">Session Summary</h2>
                    <p className="summary-subtitle">Review your latest posture session.</p>
                  </div>
                </div>

                <div className="session-summary-grid">
                  <div className="summary-row">
                    <span>Date</span>
                    <span>{sessionData.date}</span>
                  </div>
                  <div className="summary-row">
                    <span>Time Started</span>
                    <span>{sessionData.started}</span>
                  </div>
                  <div className="summary-row">
                    <span>Time Ended</span>
                    <span>{sessionData.ended}</span>
                  </div>
                  <div className="summary-row">
                    <span>Average Score</span>
                    <span>{sessionData.avg_score}</span>
                  </div>
                  <div className="summary-row">
                    <span>Best Score</span>
                    <span>{sessionData.best_score}</span>
                  </div>
                  <div className="summary-row">
                    <span>Worst Score</span>
                    <span>{sessionData.worst_score}</span>
                  </div>
                  <div className="summary-row">
                    <span>Feedback</span>
                    <span>{sessionData.feedback}</span>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    className="secondary-button"
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