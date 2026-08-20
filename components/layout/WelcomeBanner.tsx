export default function WelcomeBanner({ title, text }: { title: string; text: string }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-gold/40 bg-white p-7 shadow-gold">
      <div className="relative">
        <p className="mb-1 font-yatra text-lg text-primary">Jai Dev Ganesha</p>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[.22em] text-primary">
          Operations command centre
        </p>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          {title}
        </h1>
        <p className="section-lede mt-2">{text}</p>
      </div>
    </div>
  );
}
