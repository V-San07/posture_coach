import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Session {
  timestamp: string;
  score: number;
  status: string;
}

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
    const parseTimestamp = (value: string) => {
      const parsed = Date.parse(value);
      return Number.isNaN(parsed) ? null : parsed;
    };

    // Filter sessions according to period
    const relevant = sessions.filter((s) => {
      const time = parseTimestamp(s.timestamp);
      if (time === null) return false;
      if (period === "24h") return time >= now - 24 * 60 * 60 * 1000;
      if (period === "1h") return time >= now - 60 * 60 * 1000;
      return true; // 'all'
    });

    const groups: Record<string, number[]> = {};
    relevant.forEach((s) => {
      const time = parseTimestamp(s.timestamp);
      if (time === null) return;

      const date = new Date(time);
      let key: string;
      if (period === "all") {
        // Group by day (YYYY-MM-DD)
        key = date.toISOString().slice(0, 10);
      } else if (period === "24h") {
        // Group by hour (00-23)
        const hour = date.getHours();
        key = `${hour.toString().padStart(2, "0")}:00`;
      } else {
        // 1h -> 5-minute bucket
        const hour = date.getHours();
        const minutes = date.getMinutes();
        const bucket = Math.floor(minutes / 5) * 5;
        key = `${hour.toString().padStart(2, "0")}:${bucket.toString().padStart(2, "0")}`;
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(s.score);
    });

    return Object.entries(groups)
      .map(([label, scores]) => ({
        label,
        average: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      }))
      .sort((a, b) => {
        if (period === "all") return a.label.localeCompare(b.label);

        const toMinutes = (label: string) => {
          const [h = 0, m = 0] = label.split(":").map(Number);
          return h * 60 + m;
        };
        return toMinutes(a.label) - toMinutes(b.label);
      });
  };

  const chartData = aggregateData(sessions, period);





  return (
    <div className="mt-2 w-full max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-semibold text-white">Posture Score History</h2>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="bg-slate-900/80 text-white px-3 py-2 rounded-full border border-slate-700"
        >
          <option value="all">All</option>
          <option value="24h">Last 24 h</option>
          <option value="1h">Last 1 h</option>
        </select>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
          <XAxis dataKey="label" stroke="#e2e8f0" interval="preserveStartEnd" />
          <YAxis domain={[0, 100]} stroke="#e2e8f0" />
          <Tooltip />
          <Bar dataKey="average" fill="#34d399" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
