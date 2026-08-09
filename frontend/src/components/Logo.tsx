/**
 * The Loopy wordmark.
 *
 * Two files because the supplied artwork has a near-white wordmark, which is
 * invisible on the app's light `#f6f5f0` background. `loopy-logo.png` recolours
 * that text to navy for light surfaces; `loopy-logo-light.png` is the original
 * for dark ones. The green mark is identical in both.
 */
export default function Logo({ height = 30, tone = 'dark', className = '' }: {
  /** Rendered height in px; width follows the 259×70 aspect ratio. */
  height?: number;
  /** 'dark' = navy wordmark for light backgrounds. 'light' = white for dark ones. */
  tone?: 'dark' | 'light';
  className?: string;
}) {
  return (
    <img
      src={tone === 'light' ? '/loopy-logo-light.png' : '/loopy-logo.png'}
      alt="Loopy"
      height={height}
      width={Math.round((259 / 70) * height)}
      style={{ height, width: 'auto' }}
      className={className}
    />
  );
}
