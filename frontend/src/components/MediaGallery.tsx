'use client';
import { useRef, useState } from 'react';
import { isVideo } from '@/lib/store-config';
import { Plus } from '@/components/icons';

/**
 * Multi-media uploader: several images + at most one video. Files become
 * data-URLs (original quality, no resize/crop). Thumbnails are small and the
 * strip scrolls horizontally. Paste-a-URL is supported too.
 */
const MAX_MB = 2.5;

function readAsDataURL(f: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = rej;
    r.readAsDataURL(f);
  });
}

export default function MediaGallery({
  value, onChange, max = 8,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  max?: number;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState('');

  const addFiles = async (files: FileList | null) => {
    setErr('');
    if (!files?.length) return;
    setBusy(true);
    const next = [...value];
    for (const f of Array.from(files)) {
      if (next.length >= max) { setErr(`Up to ${max} files.`); break; }
      if (f.size > MAX_MB * 1024 * 1024) { setErr(`A file is over ${MAX_MB}MB — paste a hosted URL instead.`); continue; }
      const isVid = f.type.startsWith('video');
      if (isVid && next.some(isVideo)) { setErr('Only one video allowed.'); continue; }
      // eslint-disable-next-line no-await-in-loop
      next.push(await readAsDataURL(f));
    }
    onChange(next);
    setBusy(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const addUrl = () => {
    setErr('');
    const u = url.trim();
    if (!u) return;
    if (value.length >= max) return setErr(`Up to ${max} files.`);
    if (isVideo(u) && value.some(isVideo)) return setErr('Only one video allowed.');
    onChange([...value, u]);
    setUrl('');
  };

  const remove = (i: number) => onChange(value.filter((_, j) => j !== i));

  return (
    <div>
      <div className="no-sb flex gap-2 overflow-x-auto pb-1">
        {value.map((src, i) => (
          <div key={i} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-line bg-paper">
            {isVideo(src)
              ? <video src={src} className="h-full w-full object-cover" muted />
              : <img src={src} alt="" className="h-full w-full object-cover" />}
            {isVideo(src) && <span className="absolute bottom-0.5 left-0.5 rounded bg-black/60 px-1 text-[8px] font-bold text-white">VIDEO</span>}
            <button type="button" onClick={() => remove(i)} className="absolute right-0.5 top-0.5 grid h-4 w-4 place-items-center rounded-full bg-black/55 text-[10px] text-white hover:bg-rose">✕</button>
          </div>
        ))}
        {value.length < max && (
          <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className="grid h-20 w-20 shrink-0 place-items-center rounded-lg border-2 border-dashed border-line bg-paper text-green-600 transition-colors hover:border-green/50 disabled:opacity-60">
            <span className="grid place-items-center">
              <Plus size={18} />
              <span className="mt-0.5 text-[10px] font-bold text-muted">{busy ? '…' : 'Add'}</span>
            </span>
          </button>
        )}
      </div>

      <input ref={fileRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />

      <div className="mt-2 flex gap-2">
        <input className="c-input flex-1 py-2 text-[13px]" value={url} placeholder="…or paste an image / video URL" onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addUrl())} />
        <button type="button" onClick={addUrl} className="btn-ghost px-3 py-2 text-[13px]">Add</button>
      </div>

      <p className="mt-1 text-[11px] text-faint">Multiple images + 1 video · ≤ {MAX_MB}MB each (or paste a URL for larger).</p>
      {err && <p className="mt-1 text-[12px] font-semibold text-rose">{err}</p>}
    </div>
  );
}
