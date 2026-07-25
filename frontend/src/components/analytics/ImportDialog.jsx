import { useRef, useState } from "react";
import { UploadCloud, X, FileSpreadsheet, AlertCircle } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { API } from "@/lib/api";

export default function ImportDialog({ open, onOpenChange, onSuccess }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const reset = () => { setFile(null); setError(null); setUploading(false); };

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
    } catch (e) {
      setError(e.message || "Gagal upload file");
    } finally {
      setUploading(false);
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
        className="bg-zinc-900 border border-zinc-800 text-zinc-100 max-w-md"
      >
        <DialogHeader>
          <DialogTitle className="font-heading text-lg text-zinc-100">
            Import Data Baru
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            Unggah file <span className="font-mono-data">.xlsx / .xls / .csv</span> yang mengikuti skema
            kolom KYC yang sama. Data lama akan diganti in-memory.
          </DialogDescription>
        </DialogHeader>

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
            <p className="text-sm text-zinc-300">
              Klik atau tarik file ke sini
            </p>
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
                  {(file.size / 1024).toFixed(1)} KB
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

        <div className="flex items-center justify-end gap-2 pt-2">
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
      </DialogContent>
    </Dialog>
  );
}
