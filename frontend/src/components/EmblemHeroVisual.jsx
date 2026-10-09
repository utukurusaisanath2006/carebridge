import React, { useState, useEffect, useRef } from 'react';
import { useSettings } from '../context/SettingsContext';

/**
 * EmblemHeroVisual — v2 (Bigger + Cinematic Animations)
 *
 * Changes vs v1:
 * - Container: 90vw / max-w-[540px] → max-w-[720px] (lg)
 * - Outer ring:  spin 55s  (was 90s) — noticeably faster
 * - Mid ring:    spin 90s  (new ring between outer & inner, 2px dashed)
 * - Inner ring:  counter-spin 35s (was 140s) — fast counter-rotate
 * - Data-stream:  animated dash segments along all 4 inter-node chords
 * - nodePing:     expanding ping circle on each node, staggered
 * - glowBreath:   ambient orange blob breathes (scale + opacity)
 * - Emblem centre: stronger drop-shadows, floats more (12px)
 * - Parallax:     max offset 18px (was 12px)
 */
export default function EmblemHeroVisual() {
  const { motionPaused, isDark } = useSettings();
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  useEffect(() => {
    if (motionPaused || typeof window === 'undefined') return;
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouch) return;

    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (window.innerWidth / 2);
      const dy = (e.clientY - cy) / (window.innerHeight / 2);
      setOffset({
        x: Math.max(-18, Math.min(18, dx * 18)),
        y: Math.max(-18, Math.min(18, dy * 18)),
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [motionPaused]);

  const parallaxStyle = motionPaused
    ? {}
    : {
        transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
        transition: 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
      };

  /* ── Node positions (on Ring 1, r=280, centre 320,320) ──
     HOSPITAL  : 220° → ~(105, 140)
     PATIENT   : 320° → ~(535, 140)
     CAREGIVER : 40°  → ~(535, 500)
     OPERATOR  : 140° → ~(105, 500)
  */
  const nodes = [
    { id: 'HOSPITAL',  cx: 105, cy: 140, label: 'HOSPITAL',  delay: '0s',    pillX: 105, pillY: 108, pillW: 84,  pingDelay: '0s' },
    { id: 'PATIENT',   cx: 535, cy: 140, label: 'PATIENT',   delay: '0.75s', pillX: 535, pillY: 108, pillW: 76,  pingDelay: '0.6s' },
    { id: 'CAREGIVER', cx: 535, cy: 500, label: 'CAREGIVER', delay: '1.5s',  pillX: 535, pillY: 532, pillW: 88,  pingDelay: '1.2s' },
    { id: 'OPERATOR',  cx: 105, cy: 500, label: 'OPERATOR',  delay: '2.25s', pillX: 105, pillY: 532, pillW: 84,  pingDelay: '1.8s' },
  ];

  /* Chord pairs for data-stream lines */
  const chords = [
    { x1: 105, y1: 140, x2: 535, y2: 140, delay: '0s' },    // H → P
    { x1: 535, y1: 140, x2: 535, y2: 500, delay: '1s' },    // P → C
    { x1: 535, y1: 500, x2: 105, y2: 500, delay: '2s' },    // C → O
    { x1: 105, y1: 500, x2: 105, y2: 140, delay: '3s' },    // O → H
    { x1: 105, y1: 140, x2: 535, y2: 500, delay: '0.5s' },  // H → C (diagonal)
    { x1: 535, y1: 140, x2: 105, y2: 500, delay: '1.5s' },  // P → O (diagonal)
  ];

  return (
    <div
      ref={containerRef}
      /* BIGGER: 90vw mobile, 540px sm, 640px md, 720px lg */
      className="relative w-[90vw] max-w-[440px] sm:max-w-[540px] md:max-w-[640px] lg:max-w-[720px] aspect-square mx-auto flex items-center justify-center select-none"
      style={parallaxStyle}
      aria-label="CareBridge Sacred Geometry Luminous Care Emblem"
    >
      {/* ══ AMBIENT ORANGE RADIAL GLOW (breathing) ══ */}
      <div
        className="pointer-events-none absolute inset-0 rounded-full opacity-50 blur-[80px] z-0"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(255,98,66,0.48) 0%, rgba(255,154,98,0.22) 42%, transparent 70%)',
          animation: motionPaused ? 'none' : 'glowBreath 5s ease-in-out infinite',
        }}
        aria-hidden="true"
      />
      {/* secondary softer mint-hint ring */}
      <div
        className="pointer-events-none absolute inset-8 rounded-full opacity-20 blur-2xl z-0"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(255,98,66,0.3) 0%, transparent 60%)',
          animation: motionPaused ? 'none' : 'glowBreath 7s ease-in-out infinite reverse',
        }}
        aria-hidden="true"
      />

      {/* ══════════════════════════════════════════════════════
          SVG LAYER  (viewBox 640×640, overflow visible)
          ══════════════════════════════════════════════════════ */}
      <svg
        viewBox="0 0 640 640"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible"
        aria-hidden="true"
      >
        <defs>
          {/* Ring-1 gradient segments */}
          <linearGradient id="r1gA" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#FF6242" stopOpacity="1" />
            <stop offset="100%" stopColor="#FF9A62" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="r1gB" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="#FF9A62" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#FF6242" stopOpacity="0.65" />
          </linearGradient>
          <linearGradient id="r1gC" x1="100%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%"   stopColor="#FF6242" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#FF6242" stopOpacity="0.12" />
          </linearGradient>
          <linearGradient id="r1gD" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#FF6242" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#FF6242" stopOpacity="1" />
          </linearGradient>

          {/* Bridge arc gradient */}
          <linearGradient id="bridgeArcGrad" x1="105" y1="140" x2="535" y2="140" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#FF6242" />
            <stop offset="50%"  stopColor="#FF9A62" />
            <stop offset="85%"  stopColor="#FF8050" />
            <stop offset="100%" stopColor="#FF6242" />
          </linearGradient>

          {/* Data-stream dash gradient */}
          <linearGradient id="streamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#FF6242" stopOpacity="0" />
            <stop offset="50%"  stopColor="#FF9A62" stopOpacity="1" />
            <stop offset="100%" stopColor="#FF6242" stopOpacity="0" />
          </linearGradient>

          {/* Filters */}
          <filter id="glow" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glowStrong" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="7" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="bridgeGlow" x="-20%" y="-60%" width="140%" height="220%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* ── RING 1: OUTER (r=280, 2.5px, spin 55s) ── */}
        <g
          style={{
            transformOrigin: '320px 320px',
            animation: motionPaused ? 'none' : 'spin 55s linear infinite',
            filter: 'url(#glow)',
          }}
        >
          <path d="M 320 40 A 280 280 0 0 1 600 320" stroke="url(#r1gA)" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 600 320 A 280 280 0 0 1 320 600" stroke="url(#r1gB)" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 320 600 A 280 280 0 0 1 40 320"  stroke="url(#r1gC)" strokeWidth="2"   strokeLinecap="round" />
          <path d="M 40 320 A 280 280 0 0 1 320 40"   stroke="url(#r1gD)" strokeWidth="2.5" strokeLinecap="round" />
          {/* Tick marks on ring 1 */}
          {[0,30,60,90,120,150,180,210,240,270,300,330].map(deg => {
            const rad = (deg - 90) * Math.PI / 180;
            const ox = 320 + 280 * Math.cos(rad);
            const oy = 320 + 280 * Math.sin(rad);
            const ix = 320 + 272 * Math.cos(rad);
            const iy = 320 + 272 * Math.sin(rad);
            return <line key={deg} x1={ox} y1={oy} x2={ix} y2={iy} stroke="#FF6242" strokeWidth="1" strokeOpacity="0.55" />;
          })}
        </g>

        {/* ── RING 2: MID (r=258, 1.5px dashed, spin 90s) ── NEW */}
        <g
          style={{
            transformOrigin: '320px 320px',
            animation: motionPaused ? 'none' : 'spin 90s linear infinite',
          }}
        >
          <circle cx="320" cy="320" r="258" stroke="#FF6242" strokeWidth="1.5" strokeDasharray="12 6" strokeOpacity="0.28" />
          {/* 8 bright pip marks */}
          {[0,45,90,135,180,225,270,315].map(deg => {
            const rad = (deg - 90) * Math.PI / 180;
            return (
              <circle key={deg}
                cx={320 + 258 * Math.cos(rad)}
                cy={320 + 258 * Math.sin(rad)}
                r="2.5" fill="#FF9A62" opacity="0.6"
              />
            );
          })}
        </g>

        {/* ── RING 3: INNER (r=210, 1px dashed, counter-spin 35s) ── */}
        <g
          style={{
            transformOrigin: '320px 320px',
            animation: motionPaused ? 'none' : 'spinReverse 35s linear infinite',
          }}
        >
          <circle cx="320" cy="320" r="210" stroke="#FF6242" strokeWidth="1" strokeDasharray="4 9" strokeOpacity="0.5" />
          {[0,90,180,270].map(deg => {
            const rad = (deg - 90) * Math.PI / 180;
            return (
              <circle key={deg}
                cx={320 + 210 * Math.cos(rad)}
                cy={320 + 210 * Math.sin(rad)}
                r="2" fill="#FF9A62" opacity="0.9"
              />
            );
          })}
        </g>

        {/* ── RING 4: INNERMOST geometry lattice (r=155, 3-segment, spin 70s) ── */}
        <g
          style={{
            transformOrigin: '320px 320px',
            animation: motionPaused ? 'none' : 'spinReverse 70s linear infinite',
            filter: 'url(#glow)',
          }}
        >
          <circle cx="320" cy="320" r="155" stroke="#FF6242" strokeWidth="1" strokeDasharray="2 14" strokeOpacity="0.35" />
          {/* Triangle inscribed */}
          {(() => {
            const pts = [0,120,240].map(d => {
              const r2 = (d - 90) * Math.PI / 180;
              return `${320 + 155 * Math.cos(r2)},${320 + 155 * Math.sin(r2)}`;
            });
            return <polygon points={pts.join(' ')} stroke="#FF6242" strokeWidth="1" strokeOpacity="0.22" fill="none" />;
          })()}
        </g>

        {/* ── DATA-STREAM DASHES (animated along chords) ── */}
        {!motionPaused && chords.map((c, i) => (
          <line
            key={i}
            x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2}
            stroke="url(#streamGrad)"
            strokeWidth="1"
            strokeDasharray="24 200"
            strokeOpacity="0.65"
            style={{
              animation: `dataStream ${3.5 + i * 0.3}s ease-in-out ${c.delay} infinite`,
            }}
          />
        ))}

        {/* ── BRIDGE ARC (HOSPITAL → PATIENT, pulsing) ── */}
        <g filter="url(#bridgeGlow)">
          <path
            d="M 105 140 Q 320 60 535 140"
            stroke="url(#bridgeArcGrad)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="8 5"
            fill="none"
            opacity="0.95"
            style={{ animation: motionPaused ? 'none' : 'pulseGlow 3s ease-in-out infinite' }}
          />
          <path
            d="M 105 140 Q 320 60 535 140"
            stroke="#FF6242"
            strokeWidth="1"
            strokeOpacity="0.3"
            fill="none"
          />
        </g>

        {/* ── 4 CARDINAL NODES ── */}
        {nodes.map(n => (
          <g key={n.id}>
            {/* Expanding ping ring */}
            <circle
              cx={n.cx} cy={n.cy} r="9"
              fill="none" stroke="#FF6242" strokeWidth="1.5" opacity="0.8"
              style={{ animation: motionPaused ? 'none' : `nodePing 2.8s ease-out ${n.pingDelay} infinite` }}
            />
            {/* Secondary outer ping (offset delay) */}
            <circle
              cx={n.cx} cy={n.cy} r="9"
              fill="none" stroke="#FF9A62" strokeWidth="1" opacity="0.45"
              style={{ animation: motionPaused ? 'none' : `nodePing 2.8s ease-out calc(${n.pingDelay} + 1.4s) infinite` }}
            />
            {/* Core dot */}
            <circle cx={n.cx} cy={n.cy} r="6" fill="#FF6242" filter="url(#glow)" />
            <circle cx={n.cx} cy={n.cy} r="2.5" fill="#FFFFFF" />
            {/* Label pill */}
            <g transform={`translate(${n.pillX}, ${n.pillY})`}>
              <rect
                x={-n.pillW / 2} y="-13"
                width={n.pillW} height="26"
                rx="13"
                fill={isDark ? 'rgba(5,5,5,0.93)' : 'rgba(15,15,15,0.95)'}
                stroke="rgba(255,98,66,0.5)"
                strokeWidth="1"
              />
              <text
                x="0" y="1"
                textAnchor="middle" dominantBaseline="middle"
                fill="#FF6242"
                fontFamily="'IBM Plex Mono', monospace"
                fontSize="11.5"
                fontWeight="700"
                letterSpacing="0.09em"
              >
                {n.label}
              </text>
            </g>
          </g>
        ))}
      </svg>

      {/* ══ CENTRE EMBLEM IMAGE ══ */}
      <div
        className={`relative z-5 flex items-center justify-center ${
          isDark
            ? 'w-[70%] h-[70%]'
            : 'w-[70%] h-[70%] rounded-full overflow-hidden bg-[#050505] border-2 border-[#FF6242]/50 shadow-[0_0_60px_rgba(255,98,66,0.45)]'
        }`}
        style={{
          animation: motionPaused ? 'none' : 'emblemFloat 8s ease-in-out infinite alternate',
        }}
      >
        <picture className="w-full h-full flex items-center justify-center rounded-full overflow-hidden">
          <source srcSet="/assets/carebridge-emblem-1024.webp" media="(min-width: 640px)" type="image/webp" />
          <img
            src="/assets/carebridge-emblem-640.webp"
            alt="CareBridge Clinical Coordination Emblem"
            width="640"
            height="640"
            loading="eager"
            fetchPriority="high"
            className="w-full h-full object-contain pointer-events-none select-none"
            style={{
              mixBlendMode: 'screen',
              filter: isDark
                ? 'drop-shadow(0 0 32px rgba(255,98,66,0.6)) drop-shadow(0 0 70px rgba(255,98,66,0.28)) drop-shadow(0 0 120px rgba(255,154,98,0.15))'
                : 'drop-shadow(0 0 24px rgba(255,98,66,0.55))',
            }}
          />
        </picture>
      </div>
    </div>
  );
}
