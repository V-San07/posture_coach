import { useEffect, useRef, useState } from "react";
import { PoseLandmarker, FilesetResolver, DrawingUtils } from "@mediapipe/tasks-vision";

export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export function usePose(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>
) {
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const landmarksRef = useRef<Landmark[]>([]);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    async function init() {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
      );

      landmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numPoses: 1,
      });

      detect();
    }

    function detect() {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas || !landmarkerRef.current) {
        animFrameRef.current = requestAnimationFrame(detect);
        return;
      }

      if (video.readyState < 2) {
        animFrameRef.current = requestAnimationFrame(detect);
        return;
      }

      const ctx = canvas.getContext("2d")!;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const results = landmarkerRef.current.detectForVideo(video, performance.now());

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (results.landmarks.length > 0) {
        const drawUtils = new DrawingUtils(ctx);
        drawUtils.drawLandmarks(results.landmarks[0], { color: "#00FF00", lineWidth: 2 });
        drawUtils.drawConnectors(results.landmarks[0], PoseLandmarker.POSE_CONNECTIONS, {
          color: "#00CCFF",
          lineWidth: 2,
        });
        landmarksRef.current = results.landmarks[0];
        setLandmarks(results.landmarks[0]);
      }

      animFrameRef.current = requestAnimationFrame(detect);
    }

    init();

    return () => cancelAnimationFrame(animFrameRef.current);
  }, [videoRef, canvasRef]);

  return { landmarks, landmarksRef };
}