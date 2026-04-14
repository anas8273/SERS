export function HeroCharacter({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 480 500" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Background circle */}
      <circle cx="240" cy="260" r="200" fill="url(#charBg)" opacity="0.12" />

      {/* Body */}
      <path d="M180 290c0 0 10-40 60-40s60 40 60 40v110c0 8-6 14-14 14H194c-8 0-14-6-14-14V290z" fill="url(#charBody)" />
      {/* Collar / Neckline */}
      <path d="M210 255l30 20 30-20" stroke="white" strokeWidth="3" strokeLinecap="round" />

      {/* Head */}
      <ellipse cx="240" cy="210" rx="55" ry="60" fill="#FDBCB4" />
      {/* Face details */}
      <circle cx="222" cy="205" r="4" fill="#3B2F2F" /> {/* Left eye */}
      <circle cx="258" cy="205" r="4" fill="#3B2F2F" /> {/* Right eye */}
      <circle cx="223" cy="204" r="1.5" fill="white" /> {/* Eye shine L */}
      <circle cx="259" cy="204" r="1.5" fill="white" /> {/* Eye shine R */}
      <path d="M232 222c4 5 12 5 16 0" stroke="#D4785C" strokeWidth="2.5" strokeLinecap="round" /> {/* Smile */}
      <ellipse cx="215" cy="218" rx="6" ry="3.5" fill="#F8A090" opacity="0.5" /> {/* Blush L */}
      <ellipse cx="265" cy="218" rx="6" ry="3.5" fill="#F8A090" opacity="0.5" /> {/* Blush R */}

      {/* Hijab */}
      <path d="M185 190c0-50 25-75 55-75s55 25 55 75c0 10-2 18-5 25H190c-3-7-5-15-5-25z" fill="url(#charHijab)" />
      <path d="M185 215c-5 0-10 5-12 15-3 15 0 35 10 50l25-10c-15-10-20-30-22-45-1-5-1-10-1-10z" fill="url(#charHijab)" />
      <path d="M295 215c5 0 10 5 12 15 3 15 0 35-10 50l-25-10c15-10 20-30 22-45 1-5 1-10 1-10z" fill="url(#charHijab)" />
      <path d="M188 195c2-45 24-65 52-65s50 20 52 65" stroke="url(#charHijabDark)" strokeWidth="3" fill="none" />

      {/* Left arm holding tablet */}
      <path d="M180 300c-20 10-45 20-50 35-3 10 2 15 10 12l45-25" fill="#FDBCB4" />
      {/* Tablet */}
      <rect x="100" y="310" width="80" height="56" rx="8" fill="#1E293B" />
      <rect x="104" y="314" width="72" height="48" rx="5" fill="#3B82F6" />
      {/* Tablet content */}
      <rect x="110" y="320" width="30" height="4" rx="2" fill="white" opacity="0.8" />
      <rect x="110" y="328" width="22" height="3" rx="1.5" fill="white" opacity="0.4" />
      <rect x="110" y="340" width="56" height="16" rx="3" fill="white" opacity="0.15" />
      <rect x="114" y="344" width="10" height="8" rx="1" fill="#10B981" opacity="0.8" />
      <rect x="128" y="344" width="10" height="8" rx="1" fill="#F59E0B" opacity="0.8" />
      <rect x="142" y="344" width="10" height="8" rx="1" fill="#8B5CF6" opacity="0.8" />

      {/* Right arm - waving/pointing */}
      <path d="M300 300c15 5 35 0 50-10 8-5 5-15-3-12l-40 15" fill="#FDBCB4" />

      {/* Floating elements around character */}
      {/* Document icon */}
      <g transform="translate(350, 130)">
        <rect width="50" height="60" rx="8" fill="white" style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))' }} />
        <rect x="10" y="12" width="30" height="3" rx="1.5" fill="#CBD5E1" />
        <rect x="10" y="20" width="22" height="3" rx="1.5" fill="#E2E8F0" />
        <rect x="10" y="28" width="26" height="3" rx="1.5" fill="#E2E8F0" />
        <rect x="10" y="40" width="30" height="10" rx="3" fill="#3B82F6" opacity="0.2" />
        <path d="M22 44l3 3 6-6" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" />
      </g>

      {/* AI Brain icon */}
      <g transform="translate(60, 120)">
        <circle r="28" cx="28" cy="28" fill="white" style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))' }} />
        <circle r="12" cx="28" cy="24" fill="#8B5CF6" opacity="0.15" />
        <path d="M20 24c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8-8-3.6-8-8z" fill="none" stroke="#8B5CF6" strokeWidth="2" />
        <path d="M24 22v4M28 20v6M32 22v4" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" />
        <text x="14" y="44" fill="#8B5CF6" fontSize="8" fontWeight="bold" fontFamily="system-ui">AI</text>
      </g>

      {/* Star decoration */}
      <g transform="translate(370, 260)">
        <path d="M15 0l4.6 9.4 10.4 1.5-7.5 7.3 1.8 10.3L15 23.8l-9.3 4.7 1.8-10.3L0 10.9l10.4-1.5z" fill="#F59E0B" />
      </g>

      {/* Certificate */}
      <g transform="translate(340, 350)">
        <rect width="65" height="45" rx="6" fill="white" style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))' }} />
        <rect x="8" y="8" width="49" height="6" rx="2" fill="#EF4444" opacity="0.2" />
        <rect x="12" y="20" width="30" height="3" rx="1.5" fill="#E2E8F0" />
        <rect x="12" y="27" width="22" height="3" rx="1.5" fill="#E2E8F0" />
        <circle cx="48" cy="34" r="7" fill="#F59E0B" opacity="0.3" />
        <path d="M45 34l2 2 4-4" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
      </g>

      {/* Lightbulb */}
      <g transform="translate(80, 300)">
        <circle r="18" cx="18" cy="18" fill="white" style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.08))' }} />
        <path d="M14 14c0-3.3 2.2-6 5-6s5 2.7 5 6c0 2-1 3.5-2.5 4.5V22h-5v-3.5C15 17.5 14 16 14 14z" fill="#F59E0B" />
        <rect x="16" y="23" width="5" height="2" rx="1" fill="#D97706" />
      </g>

      {/* Small dots decoration */}
      <circle cx="420" cy="220" r="4" fill="#3B82F6" opacity="0.3" />
      <circle cx="55" cy="220" r="3" fill="#10B981" opacity="0.4" />
      <circle cx="400" cy="400" r="5" fill="#8B5CF6" opacity="0.2" />
      <circle cx="100" cy="400" r="3" fill="#F59E0B" opacity="0.3" />

      <defs>
        <linearGradient id="charBg" x1="40" y1="60" x2="440" y2="460">
          <stop stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#A855F7" />
        </linearGradient>
        <linearGradient id="charBody" x1="180" y1="250" x2="300" y2="414">
          <stop stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>
        <linearGradient id="charHijab" x1="185" y1="115" x2="295" y2="280">
          <stop stopColor="#7C3AED" />
          <stop offset="1" stopColor="#6D28D9" />
        </linearGradient>
        <linearGradient id="charHijabDark" x1="188" y1="130" x2="292" y2="195">
          <stop stopColor="#6D28D9" />
          <stop offset="1" stopColor="#5B21B6" />
        </linearGradient>
      </defs>
    </svg>
  );
}
