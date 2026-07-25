import { useEffect, useState, useMemo } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fetchRecords } from "@/lib/api";

const STATUS_COLORS = {
  DONE: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
  "Approve (OK)": "text-blue-300 bg-blue-500/10 border-blue-500/20",
  Sesuai: "text-purple-300 bg-purple-500/10 border-purple-500/20",
  Pending: "text-amber-300 bg-amber-500/10 border-amber-500/20",
  Reject: "text-rose-300 bg-rose-500/10 border-rose-500/20",
};

export default function RecordsTable({ filters }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [data, setData] = useState({ total: 0, rows: [] });
  const [loading, setLoading] = useState(false);

  const params = useMemo(() => ({
    ...filters,
    search: search || undefined,
    page,
    page_size: pageSize,
  }), [filters, search, page, pageSize]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchRecords(params)
      .then((d) => !cancelled && setData(d))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [params]);

  // reset to page 1 when filter/search changes
  useEffect(() => { setPage(1); }, [filters, search]);

  const totalPages = Math.max(1, Math.ceil(data.total / pageSize));

  return (
    <section
      data-testid="records-table"
      className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden"
    >
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <div>
          <h3 className="font-heading text-base font-semibold text-zinc-100">Recent Activity</h3>
          <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-zinc-500 mt-1">
            {data.total.toLocaleString()} records match current filters
          </p>
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <Input
            data-testid="records-search"
            placeholder="Search SID, name, email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 w-72 bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 font-mono-data text-xs"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-zinc-950/50">
            <tr className="border-b border-zinc-800">
              {["No", "SID", "Name", "Category", "Maker", "Checker", "Channel", "Date", "Status"].map((h) => (
                <th
                  key={h}
                  className="px-3 py-2 text-left font-mono-data text-[10px] uppercase tracking-[0.15em] text-zinc-500"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="font-body">
            {loading && (
              <tr><td colSpan={9} className="py-8 text-center text-zinc-500 text-xs">Loading…</td></tr>
            )}
            {!loading && data.rows.length === 0 && (
              <tr><td colSpan={9} className="py-8 text-center text-zinc-500 text-xs">No records match your filters.</td></tr>
            )}
            {!loading && data.rows.map((r, i) => (
              <tr
                key={`${r.sid}-${r.no}-${i}`}
                data-testid={`records-row-${i}`}
                className="border-b border-zinc-800/60 hover:bg-zinc-800/40 transition-colors"
              >
                <td className="px-3 py-2 font-mono-data text-zinc-500">{r.no}</td>
                <td className="px-3 py-2 font-mono-data text-zinc-300">{r.sid}</td>
                <td className="px-3 py-2 text-zinc-200">
                  <div className="truncate max-w-[180px]">{r.name}</div>
                  <div className="text-[10px] text-zinc-500 truncate max-w-[180px]">{r.email}</div>
                </td>
                <td className="px-3 py-2 text-zinc-300">{r.category}</td>
                <td className="px-3 py-2 text-zinc-400">{r.maker}</td>
                <td className="px-3 py-2 text-zinc-400">{r.checker}</td>
                <td className="px-3 py-2 font-mono-data text-zinc-400">{r.channel}</td>
                <td className="px-3 py-2 font-mono-data text-zinc-500">{r.date}</td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] border ${
                      STATUS_COLORS[r.status] || "text-zinc-400 bg-zinc-800 border-zinc-700"
                    }`}
                  >
                    {r.status || "—"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between p-4 border-t border-zinc-800">
        <div className="font-mono-data text-[10px] text-zinc-500 uppercase tracking-[0.15em]">
          Page {page} of {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <Button
            data-testid="records-prev"
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-800 disabled:opacity-30"
          >
            <ChevronLeft className="w-3 h-3 mr-1" /> Prev
          </Button>
          <Button
            data-testid="records-next"
            size="sm"
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-800 disabled:opacity-30"
          >
            Next <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </div>
    </section>
  );
}
