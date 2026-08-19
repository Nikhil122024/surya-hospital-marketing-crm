"use client";

import { UploadCloud, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { uploadFile } from "@/lib/firebase/storage";

export function FileUploader({ accept = "image/*", label = "Drop a file here or browse", path = "uploads", onUploaded }: { accept?: string; label?: string; path?: string; onUploaded?: (url: string) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const chooseFile = async (selected: File | undefined) => {
    if (!selected) return;
    setFile(selected);
    if (!path) return;
    setUploading(true); setProgress(0);
    try { const url = await uploadFile(selected, `${path}/${crypto.randomUUID()}-${selected.name}`, setProgress); onUploaded?.(url); toast.success("File uploaded successfully."); }
    catch (error) { setFile(null); toast.error(error instanceof Error ? error.message : "Unable to upload file."); }
    finally { setUploading(false); }
  };
  return <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5"><label className="flex cursor-pointer flex-col items-center justify-center gap-2 text-center"><UploadCloud className="text-blue-600" /><span className="text-sm font-bold text-slate-600">{file?.name || label}</span><span className="text-xs text-slate-400">Max 10 MB · Firebase Storage</span><input type="file" accept={accept} className="sr-only" disabled={uploading} onChange={(event) => void chooseFile(event.target.files?.[0])} /></label>{uploading && <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} /></div>}{file && !uploading && <button type="button" onClick={() => setFile(null)} className="mx-auto mt-3 flex items-center gap-1 text-xs font-bold text-rose-600"><X size={14} />Remove</button>}</div>;
}
