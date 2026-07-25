import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const GRAN_LABELS = { day: "Daily", week: "Weekly", month: "Monthly" };

export default function TimeSeriesChart({ data, granularity = "day", onGranularityChange }) {
  const total = data.reduce((sum, d) => sum + d.total, 0);
  const tickFmt = (v) => {
    if (!v) return "";
    if (granularity === "month") return v.slice(0, 7);
    return v.slice(5);
  };

  return (
    <div
      data-testid="timeseries-chart"
      className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 h-full"
    >
      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div>
          <h3 className="font-heading text-base font-semibold text-zinc-100">Processing Volume</h3>
          <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-zinc-500 mt-1">
            {GRAN_LABELS[granularity]} activity trend
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="inline-flex bg-zinc-950 border border-zinc-800 rounded-md p-0.5"
            data-testid="granularity-toggle"
          >
            {["day", "week", "month"].map((g) => (
              <button
                key={g}
                data-testid={`granularity-${g}`}
                onClick={() => onGranularityChange?.(g)}
                className={`px-2.5 py-1 rounded font-mono-data text-[10px] uppercase tracking-[0.15em] transition-colors ${
                  granularity === g
                    ? "bg-zinc-800 text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
          <div className="text-right pl-2">
            <div className="font-mono-data text-xl font-light text-zinc-100 tabular-nums">
              {total.toLocaleString()}
            </div>
            <div className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              total
            </div>
          </div>
        </div>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563EB" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gDone" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34D399" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#34D399" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis dataKey="date" stroke="#71717a" tick={{ fontSize: 10 }} tickFormatter={tickFmt} />
            <YAxis stroke="#71717a" tick={{ fontSize: 10 }} />
            <Tooltip
              contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 6 }}
              labelStyle={{ color: "#a1a1aa", fontSize: 11 }}
              itemStyle={{ fontSize: 12 }}
            />
            <Area type="monotone" dataKey="total" stroke="#2563EB" strokeWidth={1.5} fill="url(#gTotal)" name="Total" />
            <Area type="monotone" dataKey="completed" stroke="#34D399" strokeWidth={1.5} fill="url(#gDone)" name="Completed" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
