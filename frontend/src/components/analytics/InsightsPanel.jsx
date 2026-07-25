import { AlertTriangle } from "lucide-react";

const CRITICAL = ["BELUM UPDATE REKENING", "DATA NASABAH NOT FOUND DI SABO 3"];

export default function InsightsPanel({ data }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div
      data-testid="insights-panel"
      className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 h-full"
    >
      <div className="mb-4 flex items-center gap-2">
        <div className="w-7 h-7 rounded-md bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
        </div>
        <div>
          <h3 className="font-heading text-base font-semibold text-zinc-100">Reason Insights</h3>
          <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-zinc-500">
            Top notes flagged in workflow
          </p>
        </div>
      </div>
      <div className="space-y-3">
        {data.length === 0 && (
          <div className="text-xs text-zinc-500 py-6 text-center">No notes in current view.</div>
        )}
        {data.map((row, idx) => {
          const critical = CRITICAL.includes(row.note);
          const pct = (row.count / max) * 100;
          return (
            <div key={row.note + idx} data-testid={`insight-row-${idx}`}>
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`text-xs truncate mr-3 ${
                    critical ? "text-rose-300 font-medium" : "text-zinc-300"
                  }`}
                >
                  {row.note}
                </span>
                <span className="font-mono-data text-xs text-zinc-200 tabular-nums shrink-0">
                  {row.count}
                </span>
              </div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    critical ? "bg-rose-500" : "bg-blue-500"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
