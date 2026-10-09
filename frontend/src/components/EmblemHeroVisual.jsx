import React, { useState, useEffect, useRef } from 'react';
import { useSettings } from '../context/SettingsContext';

/**
 * EmblemHeroVisual Component
 * 
 * Replaces the old SVG diagram with the CareBridge Sacred-Geometry / Concentric Circuit Seal.
 * Features:
 * 1. Responsive sizing: 560-620px desktop, ~80% screen width on mobile.
 * 2. Dark mode: mix-blend-mode: screen so black dissolves into #050505.
 * 3. Light mode: black seal housed in a dedicated #050505 circular container with orange glow ring.
 * 4. Concentric Rings:
 *    - Ring 1 (outer, r=280): 2px stroke rotating slowly (90s) with conic-style orange-to-mint gradient & soft glow.
 *    - Ring 2 (inner, r=238): 1px dashed ring counter-rotating (140s).
 *    - 4 Nodes: HOSPITAL, PATIENT, CAREGIVER, OPERATOR with horizontal IBM Plex Mono pills and staggered pulse.
 *    - Bridge Arc: Glowing curved line pulsing between HOSPITAL and PATIENT nodes.
 * 5. Floating motion (translateY(8px) over 8s) + breathing glow pulse.
 * 6. Desktop pointer parallax (up to 12px offset, non-touch).
 * 7. Complete accessibility: pauses with motion toggle and prefers-reduced-motion.
 */
export default function EmblemHeroVisual() {
  const { motionPaused, isDark } = useSettings();
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Subtle pointer parallax on desktop (max 12px offset)
  useEffect(() => {
    if (motionPaused || typeof window === 'undefined') return;
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouch) return;

    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = (e.clientX - centerX) / (window.innerWidth / 2);
      const deltaY = (e.clientY - centerY) / (window.innerHeight / 2);
      
      setOffset({
        x: Math.max(-12, Math.min(12, deltaX * 12)),
        y: Math.max(-12, Math.min(12, deltaY * 12))
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [motionPaused]);

  const parallaxStyle = motionPaused
    ? {}
    : {
        transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
        transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      };

  return (
    <div
      ref={containerRef}
      className="relative w-[84vw] max-w-[420px] sm:max-w-[500px] lg:max-w-[620px] aspect-square mx-auto flex items-center justify-center select-none"
      style={parallaxStyle}
      aria-label="CareBridge Sacred Geometry Luminous Care Emblem"
    >
      {/* ════════ BACKGROUND AMBIENT ORANGE RADIAL GLOW ════════ */}
      <div
        className="pointer-events-none absolute inset-4 rounded-full opacity-40 blur-3xl z-0 transition-opacity"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(255, 98, 66, 0.38) 0%, rgba(255, 154, 98, 0.15) 45%, transparent 72%)'
        }}
        aria-hidden="true"
      />

      {/* ════════ SVG CONCENTRIC RINGS, NODES & BRIDGE ARC LAYER ════════ */}
      <svg
        viewBox="0 0 640 640"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible"
        aria-hidden="true"
      >
        <defs>
          {/* Ring 1 Conic-simulation Gradient Segments */}
          <linearGradient id="ring1GradA" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF6242" stopOpacity="1" />
            <stop offset="100%" stopColor="#FF9A62" stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id="ring1GradB" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FF9A62" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#FF6242" stopOpacity="0.65" />
          </linearGradient>
          <linearGradient id="ring1GradC" x1="100%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#FF6242" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#FF6242" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="ring1GradD" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF6242" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#FF6242" stopOpacity="1" />
          </linearGradient>

          {/* Bridge Arc Gradient (Hospital to Patient) */}
          <linearGradient id="bridgeArcGrad" x1="105.5" y1="140" x2="534.5" y2="140" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FF6242" />
            <stop offset="50%" stopColor="#FF9A62" />
            <stop offset="85%" stopColor="#FF8050" />
            <stop offset="100%" stopColor="#FF6242" />
          </linearGradient>

          {/* Soft Glow Filter for Ring and Nodes */}
          <filter id="orangeSoftGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          
          <filter id="bridgeGlow" x="-20%" y="-40%" width="140%" height="180%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* ════════ RING 1 (OUTER, r=280, 2px border, rotating 90s) ════════ */}
        <g
          className="origin-center"
          style={{
            transformOrigin: '320px 320px',
            animation: motionPaused ? 'none' : 'spin 90s linear infinite',
            filter: 'url(#orangeSoftGlow)'
          }}
        >
          {/* Segment 1: Top-Right (0 to 90 deg) */}
          <path
            d="M 320 40 A 280 280 0 0 1 600 320"
            stroke="url(#ring1GradA)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Segment 2: Bottom-Right (90 to 180 deg) */}
          <path
            d="M 600 320 A 280 280 0 0 1 320 600"
            stroke="url(#ring1GradB)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Segment 3: Bottom-Left (180 to 270 deg) */}
          <path
            d="M 320 600 A 280 280 0 0 1 40 320"
            stroke="url(#ring1GradC)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          {/* Segment 4: Top-Left (270 to 360 deg) */}
          <path
            d="M 40 320 A 280 280 0 0 1 320 40"
            stroke="url(#ring1GradD)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>

        {/* ════════ RING 2 (INNER, r=238, 1px dashed, counter-rotating 140s) ════════ */}
        <g
          className="origin-center"
          style={{
            transformOrigin: '320px 320px',
            animation: motionPaused ? 'none' : 'spinReverse 140s linear infinite'
          }}
        >
          <circle
            cx="320"
            cy="320"
            r="238"
            stroke="#FF6242"
            strokeWidth="1"
            strokeDasharray="4 8"
            strokeOpacity="0.45"
          />
          {/* Orange accent dash dots on inner ring */}
          <circle cx="320" cy="82" r="2" fill="#FF9A62" opacity="0.8" />
          <circle cx="558" cy="320" r="2" fill="#FF9A62" opacity="0.8" />
          <circle cx="320" cy="558" r="2" fill="#FF9A62" opacity="0.8" />
          <circle cx="82" cy="320" r="2" fill="#FF9A62" opacity="0.8" />
        </g>

        {/* ════════ THE BRIDGE ARC (PULSING BETWEEN HOSPITAL AND PATIENT) ════════ */}
        <g filter="url(#bridgeGlow)">
          {/* Base Bridge Line */}
          <path
            d="M 105.5 140 Q 320 70 534.5 140"
            stroke="url(#bridgeArcGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="6 4"
            fill="none"
            opacity="0.9"
            style={{
              animation: motionPaused ? 'none' : 'pulseGlow 3s ease-in-out infinite'
            }}
          />
          {/* Secondary thin underlying aura line */}
          <path
            d="M 105.5 140 Q 320 70 534.5 140"
            stroke="#FF6242"
            strokeWidth="1"
            strokeOpacity="0.3"
            fill="none"
          />
        </g>

        {/* ════════ 4 CARDINAL NODES PINNED TO RING 1 ════════ */}
        
        {/* NODE 1: HOSPITAL (Top-Left, 220 deg: 105.5, 140) */}
        <g>
          {/* Pulse Halo */}
          <circle
            cx="105.5"
            cy="140"
            r="9"
            fill="none"
            stroke="#FF6242"
            strokeWidth="1.5"
            opacity="0.6"
            style={{
              animation: motionPaused ? 'none' : 'pulseGlow 2.5s ease-in-out infinite',
              animationDelay: '0s'
            }}
          />
          <circle cx="105.5" cy="140" r="5" fill="#FF6242" />
          <circle cx="105.5" cy="140" r="2" fill="#FFFFFF" />
          {/* Horizontal Mono Pill */}
          <g transform="translate(105.5, 108)">
            <rect
              x="-42"
              y="-12"
              width="84"
              height="24"
              rx="12"
              fill={isDark ? 'rgba(5, 5, 5, 0.92)' : 'rgba(15, 15, 15, 0.95)'}
              stroke="rgba(255, 98, 66, 0.45)"
              strokeWidth="1"
            />
            <text
              x="0"
              y="1"
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#FF6242"
              fontFamily="'IBM Plex Mono', monospace"
              fontSize="11"
              fontWeight="600"
              letterSpacing="0.08em"
            >
              HOSPITAL
            </text>
          </g>
        </g>

        {/* NODE 2: PATIENT (Top-Right, 320 deg: 534.5, 140) */}
        <g>
          {/* Pulse Halo */}
          <circle
            cx="534.5"
            cy="140"
            r="9"
            fill="none"
            stroke="#FF6242"
            strokeWidth="1.5"
            opacity="0.6"
            style={{
              animation: motionPaused ? 'none' : 'pulseGlow 2.5s ease-in-out infinite',
              animationDelay: '0.75s'
            }}
          />
          <circle cx="534.5" cy="140" r="5" fill="#FF6242" />
          <circle cx="534.5" cy="140" r="2" fill="#FFFFFF" />
          {/* Horizontal Mono Pill */}
          <g transform="translate(534.5, 108)">
            <rect
              x="-38"
              y="-12"
              width="76"
              height="24"
              rx="12"
              fill={isDark ? 'rgba(5, 5, 5, 0.92)' : 'rgba(15, 15, 15, 0.95)'}
              stroke="rgba(255, 98, 66, 0.45)"
              strokeWidth="1"
            />
            <text
              x="0"
              y="1"
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#FF6242"
              fontFamily="'IBM Plex Mono', monospace"
              fontSize="11"
              fontWeight="600"
              letterSpacing="0.08em"
            >
              PATIENT
            </text>
          </g>
        </g>

        {/* NODE 3: CAREGIVER (Bottom-Right, 40 deg: 534.5, 500) */}
        <g>
          {/* Pulse Halo */}
          <circle
            cx="534.5"
            cy="500"
            r="9"
            fill="none"
            stroke="#FF6242"
            strokeWidth="1.5"
            opacity="0.6"
            style={{
              animation: motionPaused ? 'none' : 'pulseGlow 2.5s ease-in-out infinite',
              animationDelay: '1.5s'
            }}
          />
          <circle cx="534.5" cy="500" r="5" fill="#FF6242" />
          <circle cx="534.5" cy="500" r="2" fill="#FFFFFF" />
          {/* Horizontal Mono Pill */}
          <g transform="translate(534.5, 532)">
            <rect
              x="-44"
              y="-12"
              width="88"
              height="24"
              rx="12"
              fill={isDark ? 'rgba(5, 5, 5, 0.92)' : 'rgba(15, 15, 15, 0.95)'}
              stroke="rgba(255, 98, 66, 0.45)"
              strokeWidth="1"
            />
            <text
              x="0"
              y="1"
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#FF6242"
              fontFamily="'IBM Plex Mono', monospace"
              fontSize="11"
              fontWeight="600"
              letterSpacing="0.08em"
            >
              CAREGIVER
            </text>
          </g>
        </g>

        {/* NODE 4: OPERATOR (Bottom-Left, 140 deg: 105.5, 500) */}
        <g>
          {/* Pulse Halo */}
          <circle
            cx="105.5"
            cy="500"
            r="9"
            fill="none"
            stroke="#FF6242"
            strokeWidth="1.5"
            opacity="0.6"
            style={{
              animation: motionPaused ? 'none' : 'pulseGlow 2.5s ease-in-out infinite',
              animationDelay: '2.25s'
            }}
          />
          <circle cx="105.5" cy="500" r="5" fill="#FF6242" />
          <circle cx="105.5" cy="500" r="2" fill="#FFFFFF" />
          {/* Horizontal Mono Pill */}
          <g transform="translate(105.5, 532)">
            <rect
              x="-42"
              y="-12"
              width="84"
              height="24"
              rx="12"
              fill={isDark ? 'rgba(5, 5, 5, 0.92)' : 'rgba(15, 15, 15, 0.95)'}
              stroke="rgba(255, 98, 66, 0.45)"
              strokeWidth="1"
            />
            <text
              x="0"
              y="1"
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#FF6242"
              fontFamily="'IBM Plex Mono', monospace"
              fontSize="11"
              fontWeight="600"
              letterSpacing="0.08em"
            >
              OPERATOR
            </text>
          </g>
        </g>
      </svg>

      {/* ════════ SACRED GEOMETRY EMBLEM ARTWORK (CENTER) ════════ */}
      <div
        className={`relative z-5 flex items-center justify-center ${
          isDark
            ? 'w-[72%] h-[72%]'
            : 'w-[72%] h-[72%] rounded-full overflow-hidden bg-[#050505] border-2 border-[#FF6242]/50 shadow-[0_0_50px_rgba(255,98,66,0.4)]'
        }`}
        style={{
          animation: motionPaused ? 'none' : 'emblemFloat 8s ease-in-out infinite alternate'
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
            className="w-full h-full object-contain pointer-events-none select-none transition-all"
            style={{
              mixBlendMode: 'screen',
              filter: isDark
                ? 'drop-shadow(0 0 25px rgba(255, 98, 66, 0.45)) drop-shadow(0 0 55px rgba(255, 98, 66, 0.2))'
                : 'drop-shadow(0 0 20px rgba(255, 98, 66, 0.5))'
            }}
          />
        </picture>
      </div>
    </div>
  );
}
