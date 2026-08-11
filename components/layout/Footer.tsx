import { COLONY_BOIS_ASSETS } from "@/lib/assets";
export default function Footer() {
  return (
    <footer className="border-t border-orange-100 bg-orange-50 px-6 py-7 text-center text-sm text-slate-600">
      <div className="flex items-center justify-center gap-2">
        <img
          src={COLONY_BOIS_ASSETS.logo.src}
          alt="Colony Bois logo"
          className="h-8 w-8 rounded-full object-cover"
        />
        <span>© 2026 Colony Bois · Jai Dev Ganesha · Celebrating together, transparently.</span>
      </div>
    </footer>
  );
}
