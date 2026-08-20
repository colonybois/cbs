export function GoldGaneshaMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <circle cx="32" cy="32" r="30" fill="none" stroke="#E5A51A" strokeWidth="1.6" />
      <circle cx="32" cy="32" r="26" fill="none" stroke="#E5A51A" strokeWidth="0.7" opacity="0.7" />
      <path
        d="M32 14c-7 0-12 5.2-12 12.2 0 3.2 1.2 6 3.2 8.1-2.6 1.8-4.2 4.8-4.2 8.2 0 6.2 5.4 10.5 13 10.5s13-4.3 13-10.5c0-3.4-1.6-6.4-4.2-8.2 2-2.1 3.2-4.9 3.2-8.1C44 19.2 39 14 32 14z"
        fill="#F8E7B0"
        stroke="#C48A12"
        strokeWidth="1.2"
      />
      <path
        d="M32 18.5c-4.8 0-8.2 3.6-8.2 8.4 0 6.2 3.6 9.4 8.2 12.6 4.6-3.2 8.2-6.4 8.2-12.6 0-4.8-3.4-8.4-8.2-8.4z"
        fill="#E5A51A"
      />
      <circle cx="28.2" cy="27.2" r="1.3" fill="#8B1118" />
      <circle cx="35.8" cy="27.2" r="1.3" fill="#8B1118" />
      <path d="M29.5 32.2c1.6 1.4 3.4 1.4 5 0" fill="none" stroke="#8B1118" strokeWidth="1.1" />
      <path
        d="M41.5 24.5c4.5-1 8.8 1.4 10.2 5.2 1 2.8-.2 5.4-2.2 6.4"
        fill="none"
        stroke="#C48A12"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="32" cy="21.5" r="1.4" fill="#8B1118" />
    </svg>
  );
}

export function GoldDivider({ className = "h-6 w-48" }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 24" className={className} aria-hidden>
      <path
        d="M8 12h74"
        fill="none"
        stroke="#E5A51A"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M138 12h74"
        fill="none"
        stroke="#E5A51A"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M90 12c6-8 14-8 20 0 6 8 14 8 20 0"
        fill="none"
        stroke="#E5A51A"
        strokeWidth="1.4"
      />
      <circle cx="110" cy="12" r="3.4" fill="none" stroke="#E5A51A" strokeWidth="1.4" />
      <circle cx="110" cy="12" r="1.4" fill="#E5A51A" />
    </svg>
  );
}

export function GoldFlourish({ className = "h-8 w-40" }: { className?: string }) {
  return (
    <svg viewBox="0 0 180 28" className={className} aria-hidden>
      <path
        d="M10 18c18-16 36-16 54 0 8 7 16 7 26 0 18-16 36-16 54 0"
        fill="none"
        stroke="#E5A51A"
        strokeWidth="1.3"
      />
      <path
        d="M54 14c-8-10-2-14 8-8M126 14c8-10 2-14-8-8"
        fill="none"
        stroke="#E5A51A"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="90" cy="16" r="2" fill="#E5A51A" />
    </svg>
  );
}

export function HangingToran({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 180" className={className} aria-hidden>
      <g stroke="#E5A51A" fill="#E5A51A" strokeWidth="1.2">
        <line x1="22" y1="0" x2="22" y2="150" strokeDasharray="1.5 7" />
        <line x1="48" y1="0" x2="48" y2="118" strokeDasharray="1.5 7" />
        <line x1="68" y1="0" x2="68" y2="86" strokeDasharray="1.5 7" />
        <circle cx="22" cy="42" r="2.1" />
        <circle cx="48" cy="28" r="2.1" />
        <circle cx="68" cy="36" r="2.1" />
        <path d="M22 150c-6 8 6 8 0 16-6-8 6-8 0-16z" fill="#E87508" stroke="#E5A51A" />
        <path d="M48 118c-5 7 5 7 0 14-5-7 5-7 0-14z" fill="#E87508" stroke="#E5A51A" />
        <path d="M68 86c-4 6 4 6 0 12-4-6 4-6 0-12z" fill="#E87508" stroke="#E5A51A" />
      </g>
    </svg>
  );
}

export function HeroMandala({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 400" className={className} aria-hidden>
      <g fill="none" stroke="#E5A51A" strokeWidth="1.1" opacity="0.45">
        <circle cx="200" cy="200" r="188" />
        <circle cx="200" cy="200" r="162" />
        <circle cx="200" cy="200" r="128" />
        <circle cx="200" cy="200" r="94" />
        <circle cx="200" cy="200" r="58" />
        <circle cx="200" cy="200" r="22" />
        {Array.from({ length: 16 }).map((_, index) => {
          const angle = (index * Math.PI) / 8;
          const x2 = 200 + Math.cos(angle) * 188;
          const y2 = 200 + Math.sin(angle) * 188;
          return <line key={index} x1="200" y1="200" x2={x2} y2={y2} />;
        })}
        {Array.from({ length: 12 }).map((_, index) => {
          const angle = (index * Math.PI) / 6;
          const cx = 200 + Math.cos(angle) * 94;
          const cy = 200 + Math.sin(angle) * 94;
          return <circle key={`p-${index}`} cx={cx} cy={cy} r="10" />;
        })}
      </g>
    </svg>
  );
}
