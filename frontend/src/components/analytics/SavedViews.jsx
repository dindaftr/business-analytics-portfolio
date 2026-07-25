import { useEffect, useState } from "react";
import { Bookmark, BookmarkPlus, Trash2, Check } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const LS_KEY = "kyc-analytics-saved-views";

function loadViews() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function persistViews(views) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(views)); } catch {}
}
function makeId() {
  return `v_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function activeCount(filters) {
  return (
    (filters.start_date ? 1 : 0) + (filters.end_date ? 1 : 0) +
    (filters.categories?.length || 0) + (filters.pics?.length || 0) +
    (filters.statuses?.length || 0) + (filters.channels?.length || 0)
  );
}

export default function SavedViews({ currentFilters, currentGranularity, onLoad }) {
  const [open, setOpen] = useState(false);
  const [views, setViews] = useState(() => loadViews());
  const [name, setName] = useState("");

  useEffect(() => { persistViews(views); }, [views]);

  const canSave = activeCount(currentFilters) > 0 && name.trim().length > 0;

  const saveCurrent = () => {
    if (!canSave) return;
    const view = {
      id: makeId(),
      name: name.trim(),
      filters: currentFilters,
      granularity: currentGranularity,
      createdAt: new Date().toISOString(),
    };
    setViews([view, ...views]);
    setName("");
    toast.success(`View "${view.name}" tersimpan`);
  };

  const remove = (id) => {
    setViews(views.filter((v) => v.id !== id));
    toast.info("View dihapus");
  };

  const load = (v) => {
    onLoad?.(v);
    setOpen(false);
    toast.success(`Memuat view "${v.name}"`);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          data-testid="btn-saved-views"
          variant="outline"
          size="sm"
          className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
        >
          <Bookmark className="w-3.5 h-3.5 mr-2" />
          Views
          {views.length > 0 && (
            <span className="ml-2 px-1.5 py-0.5 rounded bg-blue-600/20 text-blue-300 text-[10px] font-mono-data">
              {views.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="bg-zinc-900 border-zinc-800 min-w-[320px] p-2"
        align="end"
      >
        <div className="px-2 py-1 flex items-center justify-between">
          <span className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-zinc-500">
            Save Current View
          </span>
        </div>
        <div className="flex items-center gap-2 px-1 py-1">
          <Input
            data-testid="saved-views-name-input"
            placeholder="Nama view (mis. Rejected Juli)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-8 bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 text-xs"
            onKeyDown={(e) => e.key === "Enter" && saveCurrent()}
          />
          <Button
            data-testid="saved-views-save-btn"
            size="sm"
            onClick={saveCurrent}
            disabled={!canSave}
            className="bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 shrink-0"
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
          </Button>
        </div>
        {activeCount(currentFilters) === 0 && (
          <div className="px-2 py-1 text-[10px] text-zinc-600 font-body">
            Tambahkan filter dulu untuk menyimpan view.
          </div>
        )}

        <DropdownMenuSeparator className="bg-zinc-800 my-2" />

        <div className="px-2 py-1 font-mono-data text-[10px] uppercase tracking-[0.2em] text-zinc-500">
          Saved Views ({views.length})
        </div>
        {views.length === 0 && (
          <div className="px-2 py-3 text-xs text-zinc-500 font-body">
            Belum ada saved view.
          </div>
        )}
        <div className="max-h-72 overflow-y-auto">
          {views.map((v) => (
            <div
              key={v.id}
              data-testid={`saved-view-item-${v.id}`}
              className="group flex items-center gap-2 rounded px-2 py-1.5 hover:bg-zinc-800/50 transition-colors"
            >
              <button
                onClick={() => load(v)}
                className="flex-1 min-w-0 text-left"
              >
                <div className="text-xs text-zinc-200 truncate">{v.name}</div>
                <div className="font-mono-data text-[10px] text-zinc-500">
                  {activeCount(v.filters)} filter · {v.granularity || "day"}
                </div>
              </button>
              <Button
                size="sm" variant="ghost"
                data-testid={`saved-view-load-${v.id}`}
                onClick={() => load(v)}
                className="text-zinc-500 hover:text-emerald-400 h-6 w-6 p-0"
              >
                <Check className="w-3 h-3" />
              </Button>
              <Button
                size="sm" variant="ghost"
                data-testid={`saved-view-delete-${v.id}`}
                onClick={() => remove(v.id)}
                className="text-zinc-500 hover:text-rose-400 h-6 w-6 p-0"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
