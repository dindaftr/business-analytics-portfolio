import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Activity, CheckCircle2, XCircle, Users, Download,
  FileBarChart, RefreshCw,
} from "lucide-react";
import FilterBar from "@/components/analytics/FilterBar";
import KpiCards from "@/components/analytics/KpiCards";
import TimeSeriesChart from "@/components/analytics/TimeSeriesChart";
import StatusDonut from "@/components/analytics/StatusDonut";
import CategoryBar from "@/components/analytics/CategoryBar";
import PicPerformance from "@/components/analytics/PicPerformance";
import ChannelChart from "@/components/analytics/ChannelChart";
import InsightsPanel from "@/components/analytics/InsightsPanel";
import RecordsTable from "@/components/analytics/RecordsTable";
import { Button } from "@/components/ui/button";
import {
  fetchFilters, fetchSummary, fetchTimeseries, fetchStatus,
  fetchCategories, fetchPic, fetchChannels, fetchInsights, exportCsvUrl,
} from "@/lib/api";

const emptyFilters = {
  start_date: "",
  end_date: "",
  categories: [],
  pics: [],
  statuses: [],
  channels: [],
};

export default function Dashboard() {
  const [filters, setFilters] = useState(emptyFilters);
  const [options, setOptions] = useState({ categories: [], pics: [], statuses: [], channels: [] });
  const [summary, setSummary] = useState(null);
  const [timeseries, setTimeseries] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [picData, setPicData] = useState([]);
  const [channelData, setChannelData] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);

  const params = useMemo(() => ({
    start_date: filters.start_date || undefined,
    end_date: filters.end_date || undefined,
    categories: filters.categories.length ? filters.categories : undefined,
    pics: filters.pics.length ? filters.pics : undefined,
    statuses: filters.statuses.length ? filters.statuses : undefined,
    channels: filters.channels.length ? filters.channels : undefined,
  }), [filters]);

  useEffect(() => {
    fetchFilters()
      .then((opts) => setOptions(opts))
      .catch((e) => toast.error("Failed to load filter options"));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetchSummary(params),
      fetchTimeseries({ ...params, granularity: "day" }),
      fetchStatus(params),
      fetchCategories(params),
      fetchPic(params),
      fetchChannels(params),
      fetchInsights(params),
    ])
      .then(([sum, ts, st, cat, pic, ch, ins]) => {
        if (cancelled) return;
        setSummary(sum);
        setTimeseries(ts);
        setStatusData(st);
        setCategoryData(cat);
        setPicData(pic);
        setChannelData(ch);
        setInsights(ins);
      })
      .catch((e) => toast.error("Failed to load analytics"))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [params, refreshTick]);

  const handleExport = () => {
    const url = exportCsvUrl(params);
    window.open(url, "_blank");
    toast.success("Export started");
  };

  const handleReset = () => setFilters(emptyFilters);

  return (
    <div className="min-h-screen bg-zinc-950 grain-bg font-body" data-testid="dashboard-root">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur border-b border-zinc-800">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-blue-600/10 border border-blue-500/30 flex items-center justify-center">
              <FileBarChart className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="font-heading text-lg font-semibold text-zinc-100 tracking-tight leading-none">
                KYC · Analytics Console
              </h1>
              <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-zinc-500 mt-1">
                Customer Profile Update Intelligence
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              data-testid="btn-refresh"
              variant="outline"
              size="sm"
              onClick={() => setRefreshTick((n) => n + 1)}
              className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-2" /> Refresh
            </Button>
            <Button
              data-testid="btn-export-csv"
              size="sm"
              onClick={handleExport}
              className="bg-blue-600 hover:bg-blue-500 text-white"
            >
              <Download className="w-3.5 h-3.5 mr-2" /> Export CSV
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
        <FilterBar
          options={options}
          filters={filters}
          onChange={setFilters}
          onReset={handleReset}
        />

        <KpiCards summary={summary} loading={loading} />

        {/* Charts grid */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4" data-testid="charts-grid">
          <div className="lg:col-span-2">
            <TimeSeriesChart data={timeseries} />
          </div>
          <div>
            <StatusDonut data={statusData} />
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <CategoryBar data={categoryData} />
          </div>
          <div>
            <ChannelChart data={channelData} />
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <PicPerformance data={picData} />
          </div>
          <div>
            <InsightsPanel data={insights} />
          </div>
        </section>

        {/* Records */}
        <RecordsTable filters={params} />

        <footer className="py-6 border-t border-zinc-800 mt-8">
          <div className="flex items-center justify-between">
            <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-zinc-600">
              Data source: data_dummy_3000.xlsx · 3,000 records
            </p>
            <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-zinc-600">
              Emergent · Analytics
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
