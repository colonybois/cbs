import { COLONY_BOIS_ASSETS } from "@/lib/assets";

function Diya({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 40" className={className} aria-hidden>
      <ellipse cx="24" cy="30" rx="18" ry="8" fill="#E5A51A" stroke="#F0D48A" strokeWidth="1.2" />
      <g className="diya-flame">
        <path d="M24 6 C28 14 30 18 24 26 C18 18 20 14 24 6 Z" fill="#E87508" />
        <path d="M24 12 C26 16 26 18 24 22 C22 18 22 16 24 12 Z" fill="#fff3b0" />
      </g>
    </svg>
  );
}

export default function Footer() {
  return (
    <footer
      data-site-footer
      className="relative z-10 overflow-hidden bg-primary-dark px-6 py-5 text-center sm:py-6"
    >
      <div className="info-bar-pattern absolute inset-x-0 top-0 h-2" aria-hidden />
      <div className="mb-2.5 flex items-center justify-center gap-3">
        <Diya className="h-5 w-6" />
        <Diya className="h-6 w-7" />
        <Diya className="h-5 w-6" />
      </div>
      <div className="mx-auto flex max-w-[calc(100%-4.5rem)] flex-col items-center justify-center gap-1.5">
        <img
          src={COLONY_BOIS_ASSETS.logo.src}
          alt="Colony Bois logo"
          className="h-8 w-8 rounded-full border border-gold object-cover"
        />
        <p className="font-yatra text-lg leading-tight text-[var(--gold)]">Ganpati Bappa Morya</p>
        <p className="text-[11px] leading-4 text-[#FFF8E8]/75">
          © 2026 Colony Bois · Jai Dev Ganesha
          <br />
          Celebrating together, transparently
        </p>
      </div>
    </footer>
  );
}
