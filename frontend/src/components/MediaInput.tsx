'use client';
import { useRef, useState } from 'react';
import { isVideo } from '@/lib/store-config';

/**
 * Media field for the store editor: paste an image/video URL OR upload a file.
 * Files are read as data-URLs (no external storage needed). A size cap keeps the
 * saved config small enough to publish — large videos should use a hosted URL.
 */
// Kept under Vercel's ~4.5MB serverless body limit once base64-inflated (~1.35x).
const MAX_MB = 2.5;

export default function MediaInput({
  value, onChange, placeholder = 'Paste image or video URL…',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const pickFile = (f?: File) => {
    setErr('');
    if (!f) return;
    if (f.size > MAX_MB * 1024 * 1024) {
      setErr(`That file is over ${MAX_MB}MB. For large videos, host it (YouTube/Cloudinary/Supabase) and paste the URL instead.`);
      return;
    }
    setBusy(true);
    const reader = new FileReader();
    reader.onload = () => { onChange(String(reader.result)); setBusy(false); };
    reader.onerror = () => { setErr('Could not read that file.'); setBusy(false); };
    reader.readAsDataURL(f);
  };

  const isData = value.startsWith('data:');

  return (
    <div>
      {/* URL field — hidden value when it's an uploaded data-URL */}
      <input
        className="c-input"
        value={isData ? '' : value}
        placeholder={isData ? 'Uploaded file ✓' : placeholder}
        onChange={(e) => onChange(e.target.value)}
      />

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => fileRef.current?.click()} className="btn-ghost px-3 py-2 text-[13px]" disabled={busy}>
          {busy ? 'Loading…' : '⬆ Upload image / video'}
        </button>
        <span className="text-[12px] text-faint">≤ {MAX_MB}MB</span>
        <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={(e) => pickFile(e.target.files?.[0] || undefined)} />
      </div>

      {err && <p className="mt-1.5 text-[12px] font-semibold text-rose">{err}</p>}

      {value && (
        <div className="mt-2 overflow-hidden rounded-lg border border-line">
          {isVideo(value)
            ? <video src={value} className="h-28 w-full object-cover" muted loop autoPlay playsInline />
            : <img src={value} alt="" className="h-28 w-full object-cover" />}
          <button type="button" onClick={() => onChange('')} className="block w-full bg-paper py-1.5 text-[12px] font-semibold text-rose hover:bg-rose-soft/50">Remove</button>
        </div>
      )}
    </div>
  );
}
