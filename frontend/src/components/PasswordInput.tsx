'use client';
import { useState } from 'react';
import { Eye, EyeOff } from '@/components/icons';

/**
 * Password field with a show/hide toggle.
 *
 * The button is `tabIndex={-1}` so tabbing goes password → submit rather than
 * landing on the eye, and it carries an aria-label since the icon alone doesn't
 * announce anything to a screen reader.
 */
export default function PasswordInput({
  value, onChange, placeholder = '••••••••', autoComplete = 'current-password',
  className = 'c-input', onEnter,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  autoComplete?: string;
  className?: string;
  onEnter?: () => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onKeyDown={(e) => e.key === 'Enter' && onEnter?.()}
        className={`${className} pr-11`}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow((s) => !s)}
        aria-label={show ? 'Hide password' : 'Show password'}
        title={show ? 'Hide password' : 'Show password'}
        className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted transition-colors hover:text-navy"
      >
        {show ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  );
}
