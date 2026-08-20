type SectionTone = "primary" | "gold" | "navy" | "accent";

const TONE_MARK: Record<SectionTone, string> = {
  primary: "bg-primary/10 text-primary ring-primary/15",
  gold: "bg-secondary/15 text-[#b8860b] ring-secondary/25",
  navy: "bg-navy/10 text-navy ring-navy/15",
  accent: "bg-accent/10 text-accent ring-accent/20",
};

type SectionHeadingProps = {
  kicker: string;
  title: string;
  symbol?: string;
  tone?: SectionTone;
  lede?: string;
  align?: "left" | "center";
};

/** Shared section title with a colored festival mark. */
export default function SectionHeading({
  kicker,
  title,
  symbol = "ॐ",
  tone = "primary",
  lede,
  align = "left",
}: SectionHeadingProps) {
  const centered = align === "center";

  return (
    <div className={centered ? "text-center" : undefined}>
      <div
        className={`flex items-center gap-2.5 ${centered ? "justify-center" : ""}`}
      >
        <span
          aria-hidden="true"
          className={`grid h-9 w-9 flex-none place-items-center rounded-full font-yatra text-lg leading-none ring-1 ${TONE_MARK[tone]}`}
        >
          {symbol}
        </span>
        <p className="font-cinzel text-xs font-semibold uppercase tracking-[.22em] text-primary">
          {kicker}
        </p>
      </div>
      <h2
        className={`mt-2 font-display text-3xl font-semibold text-ink ${
          centered ? "sm:text-4xl" : ""
        }`}
      >
        {title}
      </h2>
      {lede ? (
        <p className={`section-lede ${centered ? "mx-auto" : ""}`}>{lede}</p>
      ) : null}
    </div>
  );
}
