import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = {
  DONE: "#34D399",
  "Approve (OK)": "#60A5FA",
  Sesuai: "#A78BFA",
  Pending: "#FBBF24",
  Reject: "#FB7185",
};
const DEFAULT = "#71717A";

export default function StatusDonut({ data, onSliceClick }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  return (
    <div
      data-testid="status-donut"
      className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 h-full"
    >
      <div className="mb-4">
        <h3 className="font-heading text-base font-semibold text-zinc-100">Status Distribution</h3>
        <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-zinc-500 mt-1">
          Final checker outcome · click a slice to drill-down
        </p>
      </div>
      <div className="relative h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="status"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              stroke="#09090b"
              strokeWidth={2}
              onClick={(entry) => entry && onSliceClick?.(entry.status)}
              style={{ cursor: onSliceClick ? "pointer" : "default" }}
            >
              {data.map((d) => (
                <Cell key={d.status} fill={COLORS[d.status] || DEFAULT} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 6 }}
              labelStyle={{ color: "#a1a1aa", fontSize: 11 }}
              itemStyle={{ fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-zinc-500">Total</div>
          <div className="font-mono-data text-2xl font-light text-zinc-100 tabular-nums">
            {total.toLocaleString()}
          </div>
        </div>
      </div>
      <div className="mt-4 space-y-1.5">
        {data.map((d) => (
          <button
            key={d.status}
            data-testid={`status-legend-${d.status}`}
            onClick={() => onSliceClick?.(d.status)}
            className="w-full flex items-center justify-between text-xs hover:bg-zinc-800/40 rounded px-1 py-0.5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: COLORS[d.status] || DEFAULT }}
              />
              <span className="text-zinc-400">{d.status}</span>
            </div>
            <span className="font-mono-data text-zinc-200 tabular-nums">
              {d.count.toLocaleString()}
              <span className="text-zinc-600 ml-2">
                {total ? `${((d.count / total) * 100).toFixed(1)}%` : "0%"}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
