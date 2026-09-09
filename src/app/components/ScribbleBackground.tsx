import React from 'react';

/**
 * ScribbleBackground renders a subtle, randomized hand-drawn doodle pattern
 * behind all cards and tiles across the application.
 *
 * Cards have 100% solid opaque backgrounds so scribbles are ONLY visible in the
 * gaps and background spaces behind cards and tiles.
 */
export function ScribbleBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none transition-colors duration-300"
      aria-hidden="true"
    >
      <svg
        className="w-full h-full text-foreground opacity-[0.055] dark:opacity-[0.08]"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
      >
        <defs>
          <pattern
            id="scribble-pattern-random"
            width="560"
            height="560"
            patternUnits="userSpaceOnUse"
          >
            {/* --- Element 1: DNA Strand (Top Left Scatter) --- */}
            <g transform="translate(30, 40) rotate(-18) scale(0.85)">
              <path
                d="M 10 10 Q 30 45, 50 10 T 90 10 T 130 10 T 170 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeDasharray="4 2 1 2"
              />
              <path
                d="M 10 40 Q 30 5, 50 40 T 90 40 T 130 40 T 170 40"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <line x1="30" y1="25" x2="30" y2="25" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="70" y1="25" x2="70" y2="25" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="110" y1="25" x2="110" y2="25" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </g>

            {/* --- Element 2: Erlenmeyer Lab Flask (Top Right Scatter) --- */}
            <g transform="translate(390, 20) rotate(14) scale(0.75)">
              <path
                d="M 25 10 L 35 10 M 27 10 L 27 25 L 12 55 C 8 62, 14 70, 22 70 L 38 70 C 46 70, 52 62, 48 55 L 33 25 L 33 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="25" cy="52" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="35" cy="45" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path d="M 16 50 Q 25 46, 30 52 T 44 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
            </g>

            {/* --- Element 3: Atom Model (Center Left) --- */}
            <g transform="translate(80, 310) rotate(35) scale(0.7)">
              <ellipse cx="40" cy="40" rx="36" ry="12" fill="none" stroke="currentColor" strokeWidth="1.6" />
              <ellipse cx="40" cy="40" rx="36" ry="12" fill="none" stroke="currentColor" strokeWidth="1.6" transform="rotate(60 40 40)" />
              <ellipse cx="40" cy="40" rx="36" ry="12" fill="none" stroke="currentColor" strokeWidth="1.6" transform="rotate(-60 40 40)" />
              <circle cx="40" cy="40" r="4.5" fill="currentColor" />
            </g>

            {/* --- Element 4: Organic Molecule Graph (Center Scatter) --- */}
            <g transform="translate(280, 210) rotate(-12) scale(0.8)">
              <circle cx="20" cy="20" r="7" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <circle cx="70" cy="15" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <circle cx="55" cy="70" r="6" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <circle cx="110" cy="50" r="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <line x1="27" y1="19" x2="61" y2="16" stroke="currentColor" strokeWidth="1.8" />
              <line x1="66" y1="24" x2="58" y2="64" stroke="currentColor" strokeWidth="1.8" />
              <line x1="77" y1="20" x2="105" y2="46" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
              <line x1="25" y1="25" x2="50" y2="66" stroke="currentColor" strokeWidth="1.4" />
            </g>

            {/* --- Element 5: ECG Medical Heart Pulse Line (Center Right) --- */}
            <g transform="translate(360, 420) rotate(-5) scale(0.85)">
              <path
                d="M 0 20 L 20 20 L 26 4 L 34 38 L 42 10 L 50 26 L 56 20 L 85 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>

            {/* --- Element 6: Microscope doodle / Lens (Bottom Left) --- */}
            <g transform="translate(190, 430) rotate(22) scale(0.7)">
              <path d="M 20 10 L 40 10 M 30 10 L 30 35 M 15 35 L 45 35" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M 30 35 C 10 40, 10 65, 25 75 L 40 75" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <rect x="20" y="75" width="25" height="6" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
            </g>

            {/* --- Element 7: Random Sparkles & Starburst Scatter --- */}
            <g transform="translate(220, 100) rotate(45) scale(0.9)">
              <path d="M 12 2 Q 12 12, 2 12 Q 12 12, 12 22 Q 12 12, 22 12 Q 12 12, 12 2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </g>
            <g transform="translate(480, 170) rotate(-15) scale(0.7)">
              <path d="M 12 2 Q 12 12, 2 12 Q 12 12, 12 22 Q 12 12, 22 12 Q 12 12, 12 2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </g>
            <g transform="translate(30, 210) scale(0.8)">
              <path d="M 10 2 Q 10 10, 2 10 Q 10 10, 10 18 Q 10 10, 18 10 Q 10 10, 10 2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </g>

            {/* --- Element 8: Scattered Dot Clusters & Mathematical Curves --- */}
            <g transform="translate(140, 170) rotate(-30) scale(0.75)">
              <path d="M 5 5 C 20 -8, 30 18, 45 5 C 60 -8, 70 18, 85 5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </g>

            <g transform="translate(470, 310) rotate(10) scale(0.75)">
              <line x1="0" y1="0" x2="12" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="12" y1="0" x2="0" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="28" cy="6" r="2" fill="currentColor" />
              <circle cx="6" cy="28" r="1.5" fill="currentColor" />
            </g>

            {/* --- Element 9: Beaker / Test Tube Rack (Far Top Scatter) --- */}
            <g transform="translate(160, 15) rotate(8) scale(0.65)">
              <rect x="10" y="15" width="40" height="25" rx="3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeDasharray="3 2" />
              <line x1="20" y1="5" x2="20" y2="40" stroke="currentColor" strokeWidth="1.6" />
              <line x1="30" y1="5" x2="30" y2="40" stroke="currentColor" strokeWidth="1.6" />
              <line x1="40" y1="5" x2="40" y2="40" stroke="currentColor" strokeWidth="1.6" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#scribble-pattern-random)" />
      </svg>
    </div>
  );
}
