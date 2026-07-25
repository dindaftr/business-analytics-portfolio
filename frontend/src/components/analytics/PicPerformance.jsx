import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

export default function PicPerformance({ data }) {
  return (
    <div
      data-testid="pic-performance"
      className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 h-full"
    >
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="font-heading text-base font-semibold text-zinc-100">PIC Workload</h3>
          <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-zinc-500 mt-1">
            Maker vs Checker task volume per person
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-zinc-400">
            <span className="w-2 h-2 rounded-sm bg-blue-500" /> Maker
          </span>
          <span className="flex items-center gap-1.5 text-zinc-400">
            <span className="w-2 h-2 rounded-sm bg-purple-400" /> Checker
          </span>
        </div>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 8, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis dataKey="pic" stroke="#71717a" tick={{ fontSize: 11 }} />
            <YAxis stroke="#71717a" tick={{ fontSize: 10 }} />
            <Tooltip
              contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 6 }}
              labelStyle={{ color: "#a1a1aa", fontSize: 11 }}
              itemStyle={{ fontSize: 12 }}
              cursor={{ fill: "#27272a80" }}
            />
            <Bar dataKey="maker" stackId="a" fill="#2563EB" radius={[0, 0, 0, 0]} />
            <Bar dataKey="checker" stackId="a" fill="#A78BFA" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
