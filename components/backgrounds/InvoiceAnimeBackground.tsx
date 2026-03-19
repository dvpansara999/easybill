export default function InvoiceAnimeBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.20),_transparent_45%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.16),_transparent_46%),radial-gradient(circle_at_bottom_left,_rgba(236,72,153,0.12),_transparent_52%)]" />
      <div className="absolute inset-0 opacity-[0.32] [background-image:linear-gradient(to_right,rgba(15,23,42,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.07)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:radial-gradient(ellipse_at_center,black_42%,transparent_72%)]" />

      <div className="absolute left-[-12%] top-[10%] h-[520px] w-[520px] rounded-full bg-indigo-200/55 blur-3xl" />
      <div className="absolute right-[-10%] top-[12%] h-[460px] w-[460px] rounded-full bg-emerald-200/45 blur-3xl" />
      <div className="absolute bottom-[-18%] left-[28%] h-[520px] w-[520px] rounded-full bg-rose-200/35 blur-3xl" />

      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,_rgba(250,250,249,0.35),_rgba(241,245,249,0.25))]" />

      <div className="inv-side inv-side--left absolute left-0 top-0 h-[580px] w-1/2 opacity-[0.82]">
        <svg className="absolute left-[-140px] top-12 w-[920px] max-w-none" viewBox="0 0 920 420" fill="none">
          <defs>
            <linearGradient id="paper" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="white" stopOpacity="0.92" />
              <stop offset="1" stopColor="white" stopOpacity="0.70" />
            </linearGradient>
            <linearGradient id="ink" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#0f172a" stopOpacity="0.10" />
              <stop offset="1" stopColor="#0f172a" stopOpacity="0.05" />
            </linearGradient>
            <filter id="softShadow" x="-20%" y="-20%" width="140%" height="160%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="12" result="blur" />
              <feOffset dy="10" result="offset" />
              <feColorMatrix
                in="offset"
                type="matrix"
                values="0 0 0 0 0.06  0 0 0 0 0.09  0 0 0 0 0.16  0 0 0 0.24 0"
                result="shadow"
              />
              <feMerge>
                <feMergeNode in="shadow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="blurGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="10" result="b" />
              <feColorMatrix
                in="b"
                type="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.35 0"
                result="g"
              />
              <feMerge>
                <feMergeNode in="g" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g className="inv-paper inv-paper--a" filter="url(#softShadow)">
            <rect x="150" y="60" width="270" height="330" rx="26" fill="url(#paper)" />
            <rect x="176" y="94" width="140" height="14" rx="7" fill="url(#ink)" />
            <rect x="176" y="120" width="210" height="10" rx="5" fill="url(#ink)" />
            <rect x="176" y="150" width="170" height="10" rx="5" fill="url(#ink)" />
            <rect x="176" y="194" width="220" height="10" rx="5" fill="url(#ink)" />
            <rect x="176" y="220" width="205" height="10" rx="5" fill="url(#ink)" />
            <rect x="176" y="246" width="188" height="10" rx="5" fill="url(#ink)" />
            <rect x="176" y="302" width="90" height="12" rx="6" fill="rgba(99,102,241,0.16)" />
            <rect x="176" y="326" width="130" height="12" rx="6" fill="rgba(16,185,129,0.16)" />
          </g>

          <g className="inv-paper inv-paper--b" filter="url(#softShadow)" opacity="0.85">
            <rect x="500" y="78" width="250" height="312" rx="26" fill="url(#paper)" />
            <rect x="526" y="110" width="160" height="14" rx="7" fill="url(#ink)" />
            <rect x="526" y="138" width="190" height="10" rx="5" fill="url(#ink)" />
            <rect x="526" y="168" width="150" height="10" rx="5" fill="url(#ink)" />
            <rect x="526" y="214" width="200" height="10" rx="5" fill="url(#ink)" />
            <rect x="526" y="240" width="184" height="10" rx="5" fill="url(#ink)" />
            <rect x="526" y="298" width="120" height="12" rx="6" fill="rgba(236,72,153,0.14)" />
          </g>

          <g className="inv-share inv-share--trail" filter="url(#blurGlow)">
            <path
              d="M220 340 C 320 280, 430 270, 520 240 C 620 210, 700 198, 760 168"
              stroke="rgba(99,102,241,0.28)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="6 18"
              fill="none"
            />
            <path
              d="M220 340 C 320 280, 430 270, 520 240 C 620 210, 700 198, 760 168"
              stroke="rgba(16,185,129,0.22)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="3 18"
              fill="none"
            />
          </g>
        </svg>
      </div>

      <div className="inv-side inv-side--right absolute right-0 top-0 h-[580px] w-1/2 opacity-[0.78]">
        <svg className="absolute right-[-160px] top-14 w-[920px] max-w-none" viewBox="0 0 920 420" fill="none">
          <defs>
            <linearGradient id="paperR" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="white" stopOpacity="0.90" />
              <stop offset="1" stopColor="white" stopOpacity="0.68" />
            </linearGradient>
            <linearGradient id="inkR" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#0f172a" stopOpacity="0.10" />
              <stop offset="1" stopColor="#0f172a" stopOpacity="0.05" />
            </linearGradient>
            <filter id="softShadowR" x="-20%" y="-20%" width="140%" height="160%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="12" result="blur" />
              <feOffset dy="10" result="offset" />
              <feColorMatrix
                in="offset"
                type="matrix"
                values="0 0 0 0 0.06  0 0 0 0 0.09  0 0 0 0 0.16  0 0 0 0.24 0"
                result="shadow"
              />
              <feMerge>
                <feMergeNode in="shadow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="blurGlowR" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="10" result="b" />
              <feColorMatrix
                in="b"
                type="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.35 0"
                result="g"
              />
              <feMerge>
                <feMergeNode in="g" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g className="inv-paper inv-paper--a" filter="url(#softShadowR)">
            <rect x="150" y="60" width="270" height="330" rx="26" fill="url(#paperR)" />
            <rect x="176" y="94" width="140" height="14" rx="7" fill="url(#inkR)" />
            <rect x="176" y="120" width="210" height="10" rx="5" fill="url(#inkR)" />
            <rect x="176" y="150" width="170" height="10" rx="5" fill="url(#inkR)" />
            <rect x="176" y="194" width="220" height="10" rx="5" fill="url(#inkR)" />
            <rect x="176" y="220" width="205" height="10" rx="5" fill="url(#inkR)" />
            <rect x="176" y="246" width="188" height="10" rx="5" fill="url(#inkR)" />
            <rect x="176" y="302" width="90" height="12" rx="6" fill="rgba(99,102,241,0.15)" />
            <rect x="176" y="326" width="130" height="12" rx="6" fill="rgba(16,185,129,0.14)" />
          </g>

          <g className="inv-paper inv-paper--b" filter="url(#softShadowR)" opacity="0.82">
            <rect x="500" y="78" width="250" height="312" rx="26" fill="url(#paperR)" />
            <rect x="526" y="110" width="160" height="14" rx="7" fill="url(#inkR)" />
            <rect x="526" y="138" width="190" height="10" rx="5" fill="url(#inkR)" />
            <rect x="526" y="168" width="150" height="10" rx="5" fill="url(#inkR)" />
            <rect x="526" y="214" width="200" height="10" rx="5" fill="url(#inkR)" />
            <rect x="526" y="240" width="184" height="10" rx="5" fill="url(#inkR)" />
            <rect x="526" y="298" width="120" height="12" rx="6" fill="rgba(236,72,153,0.13)" />
          </g>

          <g className="inv-share inv-share--trail" filter="url(#blurGlowR)">
            <path
              d="M220 340 C 320 280, 430 270, 520 240 C 620 210, 700 198, 760 168"
              stroke="rgba(236,72,153,0.20)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="6 18"
              fill="none"
            />
            <path
              d="M220 340 C 320 280, 430 270, 520 240 C 620 210, 700 198, 760 168"
              stroke="rgba(99,102,241,0.18)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="3 18"
              fill="none"
            />
          </g>
        </svg>
      </div>

      <style jsx>{`
        @media (prefers-reduced-motion: reduce) {
          .inv-paper,
          .inv-share {
            animation: none !important;
          }
        }

        .inv-side--left {
          -webkit-mask-image: linear-gradient(to right, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0));
          mask-image: linear-gradient(to right, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0));
        }

        .inv-side--right {
          -webkit-mask-image: linear-gradient(to left, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0));
          mask-image: linear-gradient(to left, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0));
        }

        .inv-paper--a {
          transform-origin: 50% 50%;
          animation: paperFloatA 16s ease-in-out infinite;
        }

        .inv-paper--b {
          transform-origin: 50% 50%;
          animation: paperFloatB 18s ease-in-out infinite;
        }

        .inv-share--trail {
          animation: sharePulse 6.5s ease-in-out infinite;
        }

        @keyframes paperFloatA {
          0% {
            transform: translate3d(0px, 0px, 0) rotate(-1.2deg);
            opacity: 0.0;
          }
          10% {
            opacity: 1;
          }
          50% {
            transform: translate3d(16px, -10px, 0) rotate(0.8deg);
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translate3d(0px, 0px, 0) rotate(-1.2deg);
            opacity: 0.0;
          }
        }

        @keyframes paperFloatB {
          0% {
            transform: translate3d(0px, 0px, 0) rotate(1.1deg);
            opacity: 0.0;
          }
          14% {
            opacity: 1;
          }
          50% {
            transform: translate3d(-18px, 12px, 0) rotate(-0.6deg);
            opacity: 1;
          }
          86% {
            opacity: 1;
          }
          100% {
            transform: translate3d(0px, 0px, 0) rotate(1.1deg);
            opacity: 0.0;
          }
        }

        @keyframes sharePulse {
          0% {
            opacity: 0.0;
            transform: translate3d(0, 0, 0);
          }
          18% {
            opacity: 0.85;
          }
          55% {
            opacity: 0.25;
            transform: translate3d(6px, -6px, 0);
          }
          100% {
            opacity: 0.0;
            transform: translate3d(0, 0, 0);
          }
        }
      `}</style>
    </div>
  )
}

