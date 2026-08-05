import { useEffect, useRef } from "react";
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
        const poseLandmarks = results.landmarks[0];
        drawUtils.drawLandmarks(poseLandmarks, {
          color: "#42F2F7",
          lineWidth: 2,
          fillColor: "#FE4A49",
        });

        drawUtils.drawConnectors(poseLandmarks, PoseLandmarker.POSE_CONNECTIONS, {
          color: "#FE4A49",
          lineWidth: 2,
        });

        landmarksRef.current = poseLandmarks;
      }

      animFrameRef.current = requestAnimationFrame(detect);
    }

    init();

    return () => cancelAnimationFrame(animFrameRef.current);
  }, [videoRef, canvasRef]);

  return { landmarksRef };
}