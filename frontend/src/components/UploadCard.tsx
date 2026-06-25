"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function UploadCard() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setFileName(f.name);
  }

  return (
    <div className="card w-full max-w-sm p-6 shadow-xl shadow-blue-900/10">
      <h3 className="text-center text-lg font-semibold">
        Upload Your Medical Policy
      </h3>
      <p className="mt-1 text-center text-sm text-muted">
        We&apos;ll extract your policy details securely
      </p>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="mt-5 flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/30 bg-primary-soft/30 px-4 py-7 text-center transition hover:border-primary/60 hover:bg-primary-soft/50"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0L8 8m4-4 4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
          </svg>
        </span>
        <span className="mt-3 font-medium text-foreground">
          {fileName ?? "Upload Policy Document"}
        </span>
        <span className="mt-0.5 text-xs text-muted">JPG, PNG, PDF (Max. 10MB)</span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf"
        className="hidden"
        onChange={onPick}
      />

      <button
        onClick={() => router.push("/register/patient")}
        className="mt-5 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark"
      >
        Upload &amp; Continue
      </button>

      <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted">
        <svg className="h-3.5 w-3.5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm0 0v2m6-7V8a6 6 0 0 0-12 0v2M5 10h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z" />
        </svg>
        Your data is safe and encrypted
      </p>
    </div>
  );
}
