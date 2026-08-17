import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement> & {
  running?: boolean;
  idle?: boolean;
};

/**
 * Mushika — Ganesha's mouse companion.
 * Always drawn facing right; the parent flips it with scaleX(-1).
 */
export function MushikaCreature({ running, idle, className, ...props }: Props) {
  const state = running ? "mushika-running" : idle ? "mushika-idle" : "";

  return (
    <svg
      viewBox="0 0 140 68"
      fill="none"
      className={`${className ?? ""} ${state}`}
      role="img"
      aria-label="Mushika, the mouse companion"
      {...props}
    >
      <defs>
        <radialGradient id="mushika-body" cx="0.4" cy="0.3" r="0.85">
          <stop offset="0%" stopColor="#a9835f" />
          <stop offset="65%" stopColor="#8a6647" />
          <stop offset="100%" stopColor="#6b4d34" />
        </radialGradient>
        <radialGradient id="mushika-muzzle" cx="0.4" cy="0.35" r="0.8">
          <stop offset="0%" stopColor="#f3e0c4" />
          <stop offset="100%" stopColor="#e0c49f" />
        </radialGradient>
        <radialGradient id="mushika-ear-outer" cx="0.4" cy="0.3" r="0.85">
          <stop offset="0%" stopColor="#a9835f" />
          <stop offset="100%" stopColor="#7d5c3f" />
        </radialGradient>
        <radialGradient id="mushika-ear-inner" cx="0.4" cy="0.35" r="0.8">
          <stop offset="0%" stopColor="#f0c9b8" />
          <stop offset="100%" stopColor="#d99f8c" />
        </radialGradient>
        <filter id="mushika-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="1.6" stdDeviation="1.4" floodColor="#1c1210" floodOpacity="0.35" />
        </filter>
      </defs>

      <g filter="url(#mushika-shadow)" stroke="#4a3320" strokeWidth="1.4" strokeLinejoin="round">
        <path
          className="mushika-part mushika-tail"
          d="M26 46 C10 48 3 40 2 26 C3 18 7 12 13 9"
          stroke="#4a3320"
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
        />
        <path
          className="mushika-part mushika-leg-back"
          d="M40 50 C38 55 38 59 41 62"
          stroke="#4a3320"
          strokeWidth="3.6"
          strokeLinecap="round"
        />
        <path
          className="mushika-part mushika-leg-front"
          d="M78 52 C79 57 80 60 83 63"
          stroke="#4a3320"
          strokeWidth="3.6"
          strokeLinecap="round"
        />
        <ellipse
          className="mushika-part mushika-body"
          cx="52"
          cy="42"
          rx="30"
          ry="19"
          fill="url(#mushika-body)"
        />
        <circle cx="96" cy="28" r="22" fill="url(#mushika-body)" />
        <circle className="mushika-part mushika-ear" cx="90" cy="8" r="13" fill="url(#mushika-ear-outer)" />
        <circle cx="90" cy="9" r="7.5" fill="url(#mushika-ear-inner)" stroke="none" />
        <ellipse cx="112" cy="34" rx="12" ry="9" fill="url(#mushika-muzzle)" />
        <ellipse cx="122" cy="32" rx="2.4" ry="1.8" fill="#3a2418" stroke="none" />
        <g stroke="#3a2418" strokeWidth="0.6" opacity="0.55" strokeLinecap="round">
          <path d="M114 30 L128 24" />
          <path d="M115 34 L130 33" />
          <path d="M114 38 L128 41" />
        </g>
        <g className="mushika-part mushika-eye" transform="translate(102 24)" stroke="none">
          <ellipse rx="6.5" ry="7.5" fill="#20120a" />
          <circle cx="2" cy="-2.6" r="2.4" fill="#fff6e9" />
          <circle cx="-1.5" cy="2" r="1" fill="#fff6e9" opacity="0.6" />
        </g>
        <circle cx="82" cy="16" r="1.8" fill="#d4a017" stroke="#ffcc80" strokeWidth="0.4" />
      </g>
    </svg>
  );
}
