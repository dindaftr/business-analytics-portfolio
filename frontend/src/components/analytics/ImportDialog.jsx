import { useEffect, useRef, useState } from "react";
import { UploadCloud, X, FileSpreadsheet, AlertCircle, History, RotateCcw } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { API, fetchBackups, restoreBackup } from "@/lib/api";
import { toast } from "sonner";

function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
  } catch { return iso; }
}

export default function ImportDialog({ open, onOpenChange, onSuccess, onRestore }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [backups, setBackups] = useState([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [restoringName, setRestoringName] = useState(null);

  const reset = () => { setFile(null); setError(null); setUploading(false); };

  const loadBackups = () => {
    setLoadingBackups(true);
    fetchBackups()
      .then((d) => setBackups(d.backups || []))
      .catch(() => setBackups([]))
      .finally(() => setLoadingBackups(false));
  };

  useEffect(() => {
    if (open) loadBackups();
  }, [open]);

  const pick = (f) => {
    setError(null);
    if (!f) return;
    const name = f.name.toLowerCase();
    if (!name.endsWith(".xlsx") && !name.endsWith(".xls") && !name.endsWith(".csv")) {
      setError("File harus .xlsx, .xls, atau .csv");
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      setError("File melebihi batas 20 MB");
      return;
    }
    setFile(f);
  };

  const upload = async () => {
    if (!file) return;
    setUploading(true); setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API}/import`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || "Import gagal");
      onSuccess?.({ rows: data.rows, filename: data.filename });
      reset();
      loadBackups();
    } catch (e) {
      setError(e.message || "Gagal upload file");
    } finally {
      setUploading(false);
    }
  };

  const doRestore = async (filename) => {
    setRestoringName(filename);
    try {
      const data = await restoreBackup(filename);
      onRestore?.({ rows: data.rows, restored_from: data.restored_from });
      loadBackups();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Restore gagal");
    } finally {
      setRestoringName(null);
    }
  };

  const handleClose = (v) => {
    if (!v) reset();
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        data-testid="import-dialog"
        className="bg-zinc-900 border border-zinc-800 text-zinc-100 max-w-lg"
      >
        <DialogHeader>
          <DialogTitle className="font-heading text-lg text-zinc-100">
            Import & Restore Data
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            Unggah dataset baru atau kembalikan versi sebelumnya dari backup terjadwal.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="import" className="w-full">
          <TabsList className="grid grid-cols-2 bg-zinc-950 border border-zinc-800">
            <TabsTrigger
              value="import"
              data-testid="tab-import"
              className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 text-zinc-400 font-mono-data text-[10px] uppercase tracking-[0.15em]"
            >
              Upload
            </TabsTrigger>
            <TabsTrigger
              value="backups"
              data-testid="tab-backups"
              className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 text-zinc-400 font-mono-data text-[10px] uppercase tracking-[0.15em]"
            >
              Backups {backups.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded bg-blue-600/20 text-blue-300 text-[10px]">
                  {backups.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="mt-4 space-y-3">
            <div
              data-testid="import-dropzone"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                pick(e.dataTransfer.files?.[0]);
              }}
              onClick={() => inputRef.current?.click()}
              className="border border-dashed border-zinc-700 hover:border-blue-500/50 rounded-lg p-6 cursor-pointer bg-zinc-950 transition-colors"
            >
              <input
                ref={inputRef}
                data-testid="import-file-input"
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => pick(e.target.files?.[0])}
              />
              <div className="flex flex-col items-center justify-center gap-2 py-4">
                <UploadCloud className="w-8 h-8 text-blue-400" />
                <p className="text-sm text-zinc-300">Klik atau tarik file ke sini</p>
                <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                  Max 20 MB · Excel atau CSV
                </p>
              </div>
            </div>

            {file && (
              <div
                data-testid="import-file-summary"
                className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs text-zinc-200 truncate">{file.name}</div>
                    <div className="font-mono-data text-[10px] text-zinc-500">
                      {formatBytes(file.size)}
                    </div>
                  </div>
                </div>
                <Button
                  size="sm" variant="ghost"
                  data-testid="import-file-clear"
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="text-zinc-500 hover:text-zinc-100"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}

            {error && (
              <div
                data-testid="import-error"
                className="flex items-start gap-2 bg-rose-500/5 border border-rose-500/20 rounded-md px-3 py-2"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="text-xs text-rose-300 break-words">{error}</div>
              </div>
            )}

            <p className="text-[10px] text-zinc-500 font-body">
              Sebelum data diganti, sistem otomatis menyimpan backup timestamped ke tab Backups.
            </p>

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                data-testid="import-cancel"
                variant="outline" size="sm"
                onClick={() => handleClose(false)}
                className="bg-zinc-950 border-zinc-800 text-zinc-300"
                disabled={uploading}
              >
                Batal
              </Button>
              <Button
                data-testid="import-submit"
                size="sm"
                onClick={upload}
                disabled={!file || uploading}
                className="bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40"
              >
                {uploading ? "Mengunggah…" : "Import"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="backups" className="mt-4">
            <div className="flex items-center gap-2 mb-3">
              <History className="w-3.5 h-3.5 text-zinc-500" />
              <span className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                Backup History
              </span>
              <div className="flex-1" />
              <Button
                size="sm" variant="ghost"
                data-testid="backups-refresh"
                onClick={loadBackups}
                className="text-zinc-500 hover:text-zinc-100 text-xs"
              >
                Refresh
              </Button>
            </div>
            {loadingBackups && (
              <div className="py-6 text-center text-xs text-zinc-500">Memuat…</div>
            )}
            {!loadingBackups && backups.length === 0 && (
              <div
                data-testid="backups-empty"
                className="py-8 text-center text-xs text-zinc-500 border border-dashed border-zinc-800 rounded-md"
              >
                Belum ada backup. Backup dibuat otomatis pada import berikutnya.
              </div>
            )}
            <div className="max-h-72 overflow-y-auto space-y-1.5">
              {backups.map((b) => (
                <div
                  key={b.filename}
                  data-testid={`backup-item-${b.filename}`}
                  className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 hover:border-zinc-700 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-blue-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-mono-data text-xs text-zinc-200 truncate">
                      {b.filename}
                    </div>
                    <div className="font-mono-data text-[10px] text-zinc-500">
                      {formatDate(b.created)} · {formatBytes(b.size)}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    data-testid={`backup-restore-${b.filename}`}
                    onClick={() => doRestore(b.filename)}
                    disabled={restoringName === b.filename}
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 h-7 text-xs disabled:opacity-40"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    {restoringName === b.filename ? "…" : "Restore"}
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
