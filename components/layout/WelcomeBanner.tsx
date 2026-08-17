export default function WelcomeBanner({ title, text }: { title: string; text: string }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-7 shadow-gold">
      <div className="relative">
        <p className="mb-1 font-yatra text-lg text-orange-700">Jai Dev Ganesha</p>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[.22em] text-orange-500">
          Operations command centre
        </p>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">{text}</p>
      </div>
      <span className="absolute -right-3 -top-8 text-9xl opacity-5">⚡</span>
    </div>
  );
}
