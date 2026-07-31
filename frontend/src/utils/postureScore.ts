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
  neckForward: boolean;
  shoulderAngle: boolean;
  spineScore: number;
}

export function analyzePosture(landmarks: Landmark[]): PostureResult {
  if (landmarks.length < 13) {
    return { 
              score: 0, 
              status: "bad", 
              feedback: "No pose detected", 
              shoulderScore: 0, 
              neckScore: 0, 
              neckForward: false, 
              shoulderAngle: false, 
              spineScore: 0 
            };
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

  //3. Spine alignment check 
  const midShoulderX = (leftShoulder.x + rightShoulder.x) / 2;
  const spineAlignment = Math.round(Math.abs(nose.x - midShoulderX)*1000); // The smaller the value, the better the alignment
  const spineScore = Math.max(0, 100 - spineAlignment); 

  // Final score
  const score = Math.round((shoulderScore + neckScore + spineScore) / 3);
  const status = score >= 50 ? "good" : "bad";

  // Feedback
  let feedback = "Good posture! Keep it up.";
  let neckForward = false;
  let shoulderAngle = false;

  if (status === "bad") {
    if (shoulderScore < 65 && neckScore < 10 && spineScore < 60) {
      feedback = "Your posture needs improvement.";
      shoulderAngle = true;
      neckForward = true;
    }
    else if(shoulderScore < 65 && spineScore < 60) {
      feedback = "Level your shoulders and align your spine";
      shoulderAngle = true;
    }
    else if(neckScore < 10 && spineScore < 60) {
      feedback = "Move your head back and align your spine";
      neckForward = true;
    }
    else if(shoulderScore < 65 && neckScore < 10) {
      feedback = "Level your shoulders and move your head back — don't hunch forward";
      shoulderAngle = true;
      neckForward = true;
    }
    else if (shoulderScore < 65) {
      feedback = "Level your shoulders";
      shoulderAngle = true;
    }   
    else if (neckScore < 10) {
      feedback = "Move your head back — don't hunch forward";
      neckForward = true;
    }
    else if (spineScore < 60) {
      feedback = "Align your spine";
    }
  }
  else{
    feedback = "Good posture! Keep it up.";
    neckForward = false;
    shoulderAngle = false;
  }

  console.log(neckScore, shoulderScore, score, status, feedback);

  return { score, status, feedback, shoulderScore, neckScore, neckForward, shoulderAngle, spineScore };
}