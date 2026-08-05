import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type PeriodOption = "10m" | "1h" | "24h" | "7d" | "30d" | "all";

type HistoryItem = {
  timestamp: string;
  score: number;
};

const periodOptions: Array<{ value: PeriodOption; label: string }> = [
  { value: "10m", label: "Last 10 minutes" },
  { value: "1h", label: "Last hour" },
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "all", label: "All time" },
];

export default function PostureHistoryChart() {
  const [period, setPeriod] = useState<PeriodOption>("24h");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function loadHistory() {
      setIsLoading(true);
      try {
        const response = await fetch(`http://localhost:8000/sessions/history?period=${period}`);
        const data = await response.json();


        if (!ignore) {
          setHistory(data.history ?? []);
        }
      } catch (error) {
        console.error("Failed to load posture history:", error);
        if (!ignore) {
          setHistory([]);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadHistory();

    return () => {
      ignore = true;
    };
  }, [period]);

  const chartData = useMemo(
    () =>
      history.map((item) => ({
        ...item,
        time: new Date(item.timestamp).toLocaleString([], {
          hour: "2-digit",
          minute: "2-digit",
          day: "numeric",
          month: "short",
        }),
      })),
    [history]
  );

  return (
    <div className="glass-card rounded-3xl p-5 text-[var(--color-text)] shadow-xl shadow-black/20">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[var(--color-text-heading)]">Recent posture history</h3>
          <p className="text-sm text-[var(--color-text-muted)]">Track your latest posture scores over time.</p>
        </div>

        <label className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
          <span>Time period</span>
          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value as PeriodOption)}
            className="rounded-xl border border-[rgba(166,173,182,0.4)] bg-[rgba(28,30,34,0.96)] px-3 py-2 text-sm text-[var(--color-text)] outline-none"
          >
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="h-72 w-full">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-[var(--color-text-muted)]">
            Loading history...
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-[var(--color-text-muted)]">
            No posture history yet for this period.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(132, 145, 163, 0.18)" />
              <XAxis
                dataKey="time"
                stroke="var(--color-accent)"
                tick={{ fontSize: 12, fill: "var(--color-accent)" }}
                label={{ value: "Time", position: "insideBottom", offset: -5, fill: "var(--color-text)" }}
              />
              <YAxis
                domain={[0, 100]}
                stroke="var(--color-accent)"
                tick={{ fontSize: 12, fill: "var(--color-accent)" }}
                label={{ value: "Score", angle: -90, position: "insideLeft", fill: "var(--color-text)" }}
              />
              <Tooltip
                formatter={(value) => [`${value ?? "n/a"}`, "Score"]}
                labelFormatter={(label) => `Time: ${label}`}
                contentStyle={{ backgroundColor: "var(--color-bg)", borderColor: "var(--color-accent)", borderRadius: 12 }}
              />
              <Bar dataKey="score" fill="#42F2F7" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
