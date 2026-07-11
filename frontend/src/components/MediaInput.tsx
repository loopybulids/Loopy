'use client';
import { useRef, useState } from 'react';
import { isVideo } from '@/lib/store-config';
import { Camera } from '@/components/icons';

/**
 * Media field: paste an image/video URL OR upload a file. Files are read as
 * data-URLs (no external storage, original bytes preserved — no resize/compress).
 * `dropzone` renders a large clickable box; otherwise a compact button.
 */
// Kept under Vercel's ~4.5MB serverless body limit once base64-inflated (~1.35x).
const MAX_MB = 2.5;

export default function MediaInput({
  value, onChange, placeholder = 'Paste image or video URL…', dropzone = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  dropzone?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const pickFile = (f?: File) => {
    setErr('');
    if (!f) return;
    if (f.size > MAX_MB * 1024 * 1024) {
      setErr(`That file is over ${MAX_MB}MB. For large files, host it (Cloudinary/Supabase/etc.) and paste the URL instead.`);
      return;
    }
    setBusy(true);
    const reader = new FileReader();
    reader.onload = () => { onChange(String(reader.result)); setBusy(false); };
    reader.onerror = () => { setErr('Could not read that file.'); setBusy(false); };
    reader.readAsDataURL(f);
  };

  const isData = value.startsWith('data:');
  const fileInput = (
    <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={(e) => pickFile(e.target.files?.[0] || undefined)} />
  );

  // shows the full media, never cropped
  const preview = value ? (
    <div className="mt-2 overflow-hidden rounded-lg border border-line bg-paper">
      {isVideo(value)
        ? <video src={value} className="max-h-72 w-full object-contain" muted loop autoPlay playsInline />
        : <img src={value} alt="" className="max-h-72 w-full object-contain" />}
      <button type="button" onClick={() => onChange('')} className="block w-full bg-white py-1.5 text-[12px] font-semibold text-rose hover:bg-rose-soft/50">Remove</button>
    </div>
  ) : null;

  if (dropzone) {
    return (
      <div>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="block w-full rounded-lg border-2 border-dashed border-line bg-paper p-6 text-center transition-colors hover:border-green/50 disabled:opacity-70"
        >
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-green-soft text-green-600 ring-1 ring-green/15"><Camera size={20} /></span>
          <div className="mt-2 font-display text-[15px] font-bold text-navy">{busy ? 'Uploading…' : 'Add a product photo'}</div>
          <p className="mt-1 text-[12.5px] text-muted">Click to upload an image or video from your device · ≤ {MAX_MB}MB</p>
        </button>
        {fileInput}
        {err && <p className="mt-1.5 text-[12px] font-semibold text-rose">{err}</p>}
        {preview}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => fileRef.current?.click()} className="btn-ghost px-3 py-2 text-[13px]" disabled={busy}>
          {busy ? 'Loading…' : value ? '⬆ Replace image / video' : '⬆ Upload image / video'}
        </button>
        <span className="text-[12px] text-faint">{value ? 'Uploaded ✓' : `≤ ${MAX_MB}MB`}</span>
        {fileInput}
      </div>
      {err && <p className="mt-1.5 text-[12px] font-semibold text-rose">{err}</p>}
      {preview}
    </div>
  );
}
