import { useRef, useEffect, useState } from "react";
import { usePose } from "./hooks/usePose";
import { analyzePosture } from "./utils/postureScore";
import PostureChart from "./components/PostureChart.tsx";

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { landmarksRef } = usePose(videoRef, canvasRef);

  const [postureResult, setPostureResult] = useState({
    score: 0,
    status: "good" as "good" | "bad",
    feedback: "Stand in front of the camera...",
    shoulderScore: 0,
    neckScore: 0,
    neckForward: false,
    shoulderAngle: false,
  });

  // 1. Camera setup
  useEffect(() => {
    async function startCamera() {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    }
    startCamera();
  }, []);

  // 2. Posture check every 1 second
  useEffect(() => {
    let tick = 0;
    const interval = setInterval(() => {
      const result = analyzePosture(landmarksRef.current);
      setPostureResult(result);

      tick++;
      if (tick % 10 === 0) {
        fetch("http://localhost:8000/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            timestamp: new Date().toISOString(),
            score: result.score,
            status: result.status,
          }),
        }).catch((err) => console.error("Failed to send session data:", err));
      }

    }, 1000);

    return () => clearInterval(interval);
  }, []);


  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 py-12 px-4">
      <h1 className="text-white text-3xl font-bold mb-6">Posture Coach</h1>

      <div className="relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="rounded-xl w-[400px] h-[200px]"
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-[400px] h-[200px]"
        />
      </div>

      {/* Posture Score */}
      <div className={`mt-6 px-4 py-2 rounded-2xl text-center ${postureResult.status === "good" ? "bg-green-600" : "bg-red-600"
        }`}>
        <p className="text-white text-4xl font-bold">{postureResult.score}</p>
        <p className="text-white text-sm mt-1">Overall Score</p>
      </div>

      {/* Feedback */}
      <p className="text-gray-400 mt-3 text-lg">Head Position: {postureResult.neckForward ? "✕" : "✓"}</p>
      <p className="text-gray-400 mt-2 text-lg">Aligned Shoulders: {postureResult.shoulderAngle ? "✕" : "✓"}</p>
      <p className="text-gray-300 mt-2 text-lg">{postureResult.feedback}</p>
      
      <PostureChart />
    </div>
  );
}