import type { Landmark } from "../hooks/usePose";

// MediaPipe landmark indices
const NOSE = 0;
const LEFT_SHOULDER = 11;
const RIGHT_SHOULDER = 12;

export interface PostureResult {
  score: number;
  status: "good" | "bad";
  feedback: string;
  shoulderScore: number;
  neckScore: number;
  
}

export function analyzePosture(landmarks: Landmark[]): PostureResult {
  if (landmarks.length < 13) {
    return { score: 0, status: "bad", feedback: "No pose detected", shoulderScore: 0, neckScore: 0 };
  }

  const nose = landmarks[NOSE];
  const leftShoulder = landmarks[LEFT_SHOULDER];
  const rightShoulder = landmarks[RIGHT_SHOULDER];

  // 1. Shoulder level check
  const shoulderDiff = Math.abs(leftShoulder.y - rightShoulder.y);
  const shoulderScore = Math.round(Math.max(0, 100 - shoulderDiff * 500));

  // 2. Forward head posture check
  const shoulderZ = (leftShoulder.z + rightShoulder.z) / 2;
  const headForward = shoulderZ - nose.z;
  const neckScore = Math.round(Math.max(0, 100 - headForward * 100));

  // Final score
  const score = Math.round((shoulderScore + neckScore) / 2);
  const status = score >= 55 ? "good" : "bad";

  // Feedback
  let feedback = "Great posture! Keep it up 💪";
  if (shoulderScore < 65) feedback = "Level your shoulders";
  else if (neckScore < 15) feedback = "Move your head back — don't hunch forward";
  else{
    feedback = "Good job! Maintain your posture.";
  }

  console.log(neckScore, shoulderScore, score, status, feedback);

  return { score, status, feedback, shoulderScore, neckScore };
}