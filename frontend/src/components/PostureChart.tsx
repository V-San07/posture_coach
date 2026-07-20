import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Session {
  timestamp: string;
  score: number;
  status: string;
}

const sampleIntervalMs = 10 * 60 * 1000; // 10 minutes

export default function PostureChart() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [period, setPeriod] = useState<string>("all");

  // Fetch all sessions from backend
  useEffect(() => {
    fetch("http://localhost:8000/sessions")
      .then((res) => res.json())
      .then((data) => setSessions(data))
      .catch((err) => console.error("Failed to fetch sessions", err));
  }, []);

  // Aggregate sessions based on selected period
  const aggregateData = (sessions: Session[], period: string) => {
    const now = Date.now();
    // Filter sessions according to period
    const relevant = sessions.filter((s) => {
      const time = new Date(s.timestamp).getTime();
      if (period === "24h") return time >= now - 24 * 60 * 60 * 1000;
      if (period === "1h") return time >= now - 60 * 60 * 1000;
      return true; // 'all'
    });

    const groups: Record<string, number[]> = {};
    relevant.forEach((s) => {
      const date = new Date(s.timestamp);
      if (isNaN(date.getTime())) {
        // Skip entries with invalid or missing timestamps
        return;
      }
      let key: string;
      if (period === "all") {
        // Group by day (YYYY-MM-DD)
        key = date.toISOString().split("T")[0];
      } else if (period === "24h") {
        // Group by hour (0‑23)
        const hour = date.getHours();
        key = `${hour}:00`;
      } else {
        // 1h -> 5‑minute bucket
        const hour = date.getHours();
        const minutes = date.getMinutes();
        const bucket = Math.floor(minutes / 5) * 5;
        key = `${hour}:${bucket.toString().padStart(2, "0")}`;
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(s.score);
    });

    return Object.entries(groups)
      .map(([label, scores]) => ({
        label,
        average: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      }))
      .sort((a, b) => (a.label > b.label ? 1 : -1));
  };

  const chartData = aggregateData(sessions, period);





  return (
    <div className="mt-8 w-full max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-semibold text-white">Posture Score History</h2>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="bg-gray-800 text-white p-1 rounded"
        >
          <option value="all">All</option>
          <option value="24h">Last 24 h</option>
          <option value="1h">Last 1 h</option>
        </select>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#555" />
          <XAxis dataKey="label" stroke="#fff" />
          <YAxis domain={[0, 100]} stroke="#fff" />
          <Tooltip />
          <Bar dataKey="average" fill="#82ca9d" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
