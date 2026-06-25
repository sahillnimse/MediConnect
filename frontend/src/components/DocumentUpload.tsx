"use client";

import { useRef, useState } from "react";

const ACCEPTED_MIME: Record<string, string> = {
    "application/pdf": "PDF",
    "image/jpeg": "JPG",
    "image/png": "PNG",
};
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function validateDocFile(file: File): string | null {
    if (!ACCEPTED_MIME[file.type]) {
        return "Only PDF, JPG, or PNG files are supported.";
    }
    if (file.size > MAX_SIZE_BYTES) {
        return "File is larger than 10MB.";
    }
    return null;
}

interface UploadedDoc {
    filename: string;
    sizeBytes: number;
}

interface DocumentUploadFieldProps {
    label: string;
    required?: boolean;
    uploading: boolean;
    uploaded: UploadedDoc | null;
    onSelect: (file: File) => void;
    onClear: () => void;
}

export default function DocumentUploadField({
    label,
    required,
    uploading,
    uploaded,
    onSelect,
    onClear,
}: DocumentUploadFieldProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragOver, setDragOver] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function handleFile(file: File | undefined) {
        if (!file) return;
        const err = validateDocFile(file);
        if (err) {
            setError(err);
            return;
        }
        setError(null);
        onSelect(file);
    }

    return (
        <div>
            <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-sm font-medium text-foreground">{label}</label>
                <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${required
                            ? "bg-amber-50 text-amber-700 ring-amber-200"
                            : "bg-slate-100 text-slate-600 ring-slate-200"
                        }`}
                >
                    {required ? "Required" : "Optional"}
                </span>
            </div>

            {uploaded ? (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-success/30 bg-success/5 px-3.5 py-2.5">
                    <div className="flex min-w-0 items-center gap-2">
                        <svg className="h-4 w-4 shrink-0 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="truncate text-sm font-medium text-foreground" title={uploaded.filename}>
                            {uploaded.filename}
                        </span>
                        <span className="shrink-0 text-xs text-muted">{formatFileSize(uploaded.sizeBytes)}</span>
                    </div>
                    <button
                        type="button"
                        onClick={onClear}
                        className="shrink-0 text-xs font-medium text-muted hover:text-danger"
                    >
                        Change
                    </button>
                </div>
            ) : (
                <>
                    <button
                        type="button"
                        disabled={uploading}
                        onClick={() => inputRef.current?.click()}
                        onDragOver={(e) => {
                            e.preventDefault();
                            setDragOver(true);
                        }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={(e) => {
                            e.preventDefault();
                            setDragOver(false);
                            handleFile(e.dataTransfer.files?.[0]);
                        }}
                        className={`flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed px-3.5 py-4 text-center transition disabled:cursor-not-allowed disabled:opacity-60 ${dragOver
                                ? "border-primary bg-primary-soft/50"
                                : "border-primary/30 bg-primary-soft/30 hover:border-primary/60 hover:bg-primary-soft/50"
                            }`}
                    >
                        {uploading ? (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/40 border-t-primary" />
                        ) : (
                            <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0L8 8m4-4 4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
                            </svg>
                        )}
                        <span className="text-sm font-medium text-foreground">
                            {uploading ? "Uploading…" : "Click or drag to upload"}
                        </span>
                        <span className="text-xs text-muted">PDF, JPG, PNG · Max 10MB</span>
                    </button>

                    <input
                        ref={inputRef}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                        className="hidden"
                        onChange={(e) => {
                            handleFile(e.target.files?.[0]);
                            e.target.value = "";
                        }}
                    />
                </>
            )}

            {error && <p className="mt-1.5 text-sm text-danger">{error}</p>}
        </div>
    );
}