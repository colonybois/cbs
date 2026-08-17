import { COLONY_BOIS_ASSETS } from "@/lib/assets";

function Diya({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 40" className={className} aria-hidden>
      <ellipse cx="24" cy="30" rx="18" ry="8" fill="#d4a017" stroke="#ffcc80" strokeWidth="1.2" />
      <g className="diya-flame">
        <path d="M24 6 C28 14 30 18 24 26 C18 18 20 14 24 6 Z" fill="#ffb347" />
        <path d="M24 12 C26 16 26 18 24 22 C22 18 22 16 24 12 Z" fill="#fff3b0" />
      </g>
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="relative z-10 overflow-hidden border-t border-amber-300/60 bg-gradient-to-b from-[#5c1a1b] via-[#7a241f] to-[#3a1410] px-6 py-12 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-amber-300 to-transparent"
      />
      <div className="mb-5 flex items-center justify-center gap-4">
        <Diya className="h-8 w-10" />
        <Diya className="h-10 w-12" />
        <Diya className="h-8 w-10" />
      </div>
      <div className="flex flex-col items-center justify-center gap-3">
        <img
          src={COLONY_BOIS_ASSETS.logo.src}
          alt="Colony Bois logo"
          className="h-11 w-11 rounded-full border-2 border-amber-300 object-cover shadow-md"
        />
        <p className="font-yatra text-2xl text-amber-200">Ganpati Bappa Morya</p>
        <p className="max-w-lg text-sm leading-6 text-orange-100/80">
          © 2026 Colony Bois · Jai Dev Ganesha · Celebrating together, transparently.
        </p>
      </div>
    </footer>
  );
}
