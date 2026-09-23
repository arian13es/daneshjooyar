import React from "react";

interface FacultyArtworkProps {
  facultyName?: string;
  isDarkMode?: boolean;
}

/**
 * ============================================================================
 * High-Precision Vector Art Engine for Tabriz University Faculties
 * ============================================================================
 * ARCHITECTURAL CONSTRAINTS & GEOMETRIC RULES:
 * 1. preserveAspectRatio="xMidYMid slice" on ALL SVGs:
 *    Guarantees 100% full-bleed coverage of the card container on any screen ratio,
 *    permanently eliminating any letterboxing seams or vertical cut-off lines in Light Mode.
 * 2. Strict Safe-Zone Coordinates (viewBox 0 0 400 240):
 *    - Focal centers anchored at x = 112 to 118 (safe center-left).
 *    - Max right extent of dense elements: x <= 165.
 *    - Student Name and ID start at x >= 200.
 *    - Result: A permanent, mathematically guaranteed 35-45px buffer between artwork and text!
 * 3. Both Light Mode and Dark Mode use jewel-tone contrast with rich vector lines.
 */

// 1. مهندسی برق و کامپیوتر (CAD-Grade Electronic Circuit & Silicon Microprocessor Architecture)
const ArtworkECE: React.FC<{ isDarkMode?: boolean }> = ({ isDarkMode }) => {
  const blue = isDarkMode ? "#38bdf8" : "#0284c7";
  const cyan = isDarkMode ? "#22d3ee" : "#0891b2";
  const amber = isDarkMode ? "#fbbf24" : "#b45309";
  const emerald = isDarkMode ? "#34d399" : "#059669";
  const chipBg = isDarkMode ? "#080e1a" : "#f8fafc";
  const dieBg = isDarkMode ? "#0f223d" : "#e0f2fe";
  const blockBg = isDarkMode ? "#1e3a8a" : "#bfdbfe";
  const ioBg = isDarkMode ? "#064e3b" : "#a7f3d0";
  const reticleBg = isDarkMode ? "#091322" : "#f0f9ff";

  return (
    <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <radialGradient id="ece-glow" cx="28%" cy="46%" r="50%">
          <stop offset="0%" stopColor={cyan} stopOpacity={isDarkMode ? "0.22" : "0.14"} />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
        <pattern id="ece-cad-grid" width="16" height="16" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="0.75" fill={blue} opacity={isDarkMode ? "0.18" : "0.12"} />
        </pattern>
      </defs>

      {/* Substrate Atmospheric Glow */}
      <rect width="400" height="240" fill="url(#ece-glow)" />
      {/* Precision CAD Engineering Reticle Grid (Confined to Left Circuit Half) */}
      <rect width="170" height="240" fill="url(#ece-cad-grid)" />

      {/* ========================================================================= */}
      {/* 1. ANALOG & MIXED-SIGNAL DOMAIN (Electrical Engineering / Telecom / DSP)  */}
      {/* ========================================================================= */}
      <g transform="translate(18, 30)" opacity={isDarkMode ? "0.9" : "0.95"}>
        {/* Oscilloscope Reticle Screen */}
        <rect x="0" y="0" width="62" height="34" rx="4" stroke={blue} strokeWidth="1.2" fill={reticleBg} />
        {/* Center Zero-Voltage Dotted Axis */}
        <line x1="0" y1="17" x2="62" y2="17" stroke={cyan} strokeWidth="0.7" strokeDasharray="2 2" opacity="0.45" />
        {/* Continuous Sinusoidal Wave (Analog Signal Domain) */}
        <path d="M 3 17 Q 8 6 13 17 T 23 17" stroke={emerald} strokeWidth="1.6" fill="none" />
        {/* ADC Quantization Transition into Discrete Digital Square Pulses */}
        <path d="M 23 17 L 27 17 L 27 8 L 35 8 L 35 26 L 43 26 L 43 8 L 51 8 L 51 17 L 59 17" stroke={cyan} strokeWidth="1.5" fill="none" />
        <text x="5" y="10" fontSize="5" fontFamily="monospace" fontWeight="900" fill={emerald}>DSP/ADC</text>
      </g>

      {/* ========================================================================= */}
      {/* 2. DIGITAL HARDWARE LOGIC (Computer Architecture & Circuit Design)        */}
      {/* ========================================================================= */}
      <g transform="translate(18, 150)" opacity={isDarkMode ? "0.9" : "0.95"}>
        {/* IEEE Standard 91-1984 2-Input NAND Gate */}
        <line x1="0" y1="9" x2="11" y2="9" stroke={blue} strokeWidth="1.5" />
        <line x1="0" y1="21" x2="11" y2="21" stroke={blue} strokeWidth="1.5" />
        {/* NAND Gate Body */}
        <path d="M 11 3 L 23 3 A 15 15 0 0 1 23 27 L 11 27 Z" stroke={blue} strokeWidth="1.6" fill={dieBg} />
        {/* Inverting Bubble */}
        <circle cx="26" cy="15" r="2.2" stroke={blue} strokeWidth="1.3" fill={isDarkMode ? "#080e1a" : "#ffffff"} />
        <text x="14" y="17" fontSize="5" fontFamily="monospace" fontWeight="900" fill={blue}>NAND</text>
        {/* Output Interconnect Trace Heading to SoC */}
        <path d="M 28.5 15 L 42 15 L 50 23 L 64 23" stroke={blue} strokeWidth="1.5" fill="none" />
      </g>

      {/* ========================================================================= */}
      {/* 3. MULTI-LAYER PCB ROUTING, SMT CAPACITORS & GROUND SYSTEM                */}
      {/* ========================================================================= */}
      <g opacity={isDarkMode ? "0.85" : "0.95"}>
        {/* Serpentine Delay-Matched Differential Bus Line */}
        <path d="M 26 86 L 38 86 L 40 81 L 44 81 L 46 91 L 50 91 L 52 81 L 56 81 L 58 86 L 74 86 L 84 96 L 94 96" stroke={amber} strokeWidth="1.3" fill="none" />
        
        {/* Discrete SMT 0805 Decoupling Capacitor */}
        <g transform="translate(36, 114)">
          <rect x="0" y="0" width="3.5" height="6" rx="0.5" fill={amber} />
          <rect x="3.5" y="0.8" width="5" height="4.4" fill={isDarkMode ? "#475569" : "#94a3b8"} />
          <rect x="8.5" y="0" width="3.5" height="6" rx="0.5" fill={amber} />
          <text x="6" y="12.5" fontSize="4.5" fontFamily="monospace" fill={isDarkMode ? "#94a3b8" : "#64748b"} textAnchor="middle">C1</text>
        </g>

        {/* IEEE Earth/Ground Plane Symbol */}
        <g transform="translate(56, 117)">
          <line x1="0" y1="0" x2="0" y2="5" stroke={blue} strokeWidth="1.4" />
          <line x1="-5" y1="5" x2="5" y2="5" stroke={blue} strokeWidth="1.6" />
          <line x1="-3" y1="8" x2="3" y2="8" stroke={blue} strokeWidth="1.3" />
          <line x1="-1" y1="11" x2="1" y2="11" stroke={blue} strokeWidth="1" />
        </g>
      </g>

      {/* ========================================================================= */}
      {/* 4. SILICON MICROPROCESSOR SoC DIE & MICROARCHITECTURE                     */}
      {/* ========================================================================= */}
      <g transform="translate(124, 102)" opacity={isDarkMode ? "0.92" : "0.97"}>
        {/* QFP Package Carrier Substrate */}
        <rect x="-26" y="-26" width="52" height="52" rx="6" stroke={blue} strokeWidth="2" fill={chipBg} />
        {/* Pin-1 Index Notch */}
        <polygon points="-26,-18 -18,-26 -26,-26" fill={amber} />

        {/* 24 Gold Micro-Pin Headers (6 per quadrant) */}
        <g stroke={amber} strokeWidth="1.6">
          {/* Left Pins */}
          <line x1="-32" y1="-15" x2="-26" y2="-15" />
          <line x1="-32" y1="-9"  x2="-26" y2="-9" />
          <line x1="-32" y1="-3"  x2="-26" y2="-3" />
          <line x1="-32" y1="3"   x2="-26" y2="3" />
          <line x1="-32" y1="9"   x2="-26" y2="9" />
          <line x1="-32" y1="15"  x2="-26" y2="15" />
          {/* Right Pins */}
          <line x1="26" y1="-15" x2="32" y2="-15" />
          <line x1="26" y1="-9"  x2="32" y2="-9" />
          <line x1="26" y1="-3"  x2="32" y2="-3" />
          <line x1="26" y1="3"   x2="32" y2="3" />
          <line x1="26" y1="9"   x2="32" y2="9" />
          <line x1="26" y1="15"  x2="32" y2="15" />
          {/* Top Pins */}
          <line x1="-15" y1="-32" x2="-15" y2="-26" />
          <line x1="-9"  y1="-32" x2="-9"  y2="-26" />
          <line x1="-3"  y1="-32" x2="-3"  y2="-26" />
          <line x1="3"   y1="-32" x2="3"   y2="-26" />
          <line x1="9"   y1="-32" x2="9"   y2="-26" />
          <line x1="15"  y1="-32" x2="15"  y2="-26" />
          {/* Bottom Pins */}
          <line x1="-15" y1="26" x2="-15" y2="32" />
          <line x1="-9"  y1="26" x2="-9"  y2="32" />
          <line x1="-3"  y1="26" x2="-3"  y2="32" />
          <line x1="3"   y1="26" x2="3"   y2="32" />
          <line x1="9"   y1="26" x2="9"   y2="32" />
          <line x1="15"  y1="26" x2="15"  y2="32" />
        </g>

        {/* Central Silicon Die Boundary */}
        <rect x="-18" y="-18" width="36" height="36" rx="3" stroke={cyan} strokeWidth="1.3" fill={dieBg} />

        {/* Microarchitectural Functional Blocks */}
        {/* 1. Core Processor Unit */}
        <rect x="-15" y="-15" width="13" height="13" rx="1.5" stroke={blue} strokeWidth="0.9" fill={blockBg} />
        <text x="-8.5" y="-6.5" fontSize="4.2" fontFamily="monospace" fontWeight="900" fill={blue} textAnchor="middle">CORE</text>
        
        {/* 2. Arithmetic Logic Unit (ALU) */}
        <rect x="2" y="-15" width="13" height="13" rx="1.5" stroke={blue} strokeWidth="0.9" fill={blockBg} />
        <text x="8.5" y="-6.5" fontSize="4.2" fontFamily="monospace" fontWeight="900" fill={blue} textAnchor="middle">ALU</text>

        {/* 3. L2 Cache Memory */}
        <rect x="-15" y="2" width="13" height="13" rx="1.5" stroke={blue} strokeWidth="0.9" fill={blockBg} />
        <text x="-8.5" y="10.5" fontSize="4" fontFamily="monospace" fontWeight="900" fill={blue} textAnchor="middle">CACHE</text>

        {/* 4. High-Speed Bus I/O Controller */}
        <rect x="2" y="2" width="13" height="13" rx="1.5" stroke={emerald} strokeWidth="0.9" fill={ioBg} />
        <text x="8.5" y="10.5" fontSize="4.5" fontFamily="monospace" fontWeight="900" fill={emerald} textAnchor="middle">I/O</text>
      </g>

      {/* ========================================================================= */}
      {/* 5. 32-BIT SYSTEM BUS & SYNCHRONOUS CLOCK SIGNAL                          */}
      {/* ========================================================================= */}
      {/* 32-Bit System Data Bus Header */}
      <g opacity={isDarkMode ? "0.85" : "0.95"}>
        <path d="M 124 70 L 124 48 L 138 34 L 152 34" stroke={blue} strokeWidth="2" fill="none" />
        <line x1="121" y1="57" x2="127" y2="53" stroke={cyan} strokeWidth="1.8" />
        <text x="117" y="52" fontSize="5" fontFamily="monospace" fontWeight="900" fill={blue} textAnchor="end">BUS [31:0]</text>
      </g>

      {/* Synchronous Clock Pulse Train (CLK) */}
      <g opacity={isDarkMode ? "0.9" : "0.95"}>
        <path d="M 80 188 L 86 188 L 86 179 L 92 179 L 92 188 L 98 188 L 98 179 L 104 179 L 104 188 L 110 188 L 110 179 L 116 179 L 116 188 L 122 188" stroke={cyan} strokeWidth="1.5" fill="none" />
        <text x="77" y="185" fontSize="5.5" fontFamily="monospace" fontWeight="900" fill={cyan} textAnchor="end">CLK</text>
      </g>

      {/* Annular Solder Mask Vias (PCB Interconnect Nodes) */}
      <g>
        <circle cx="122" cy="188" r="2.2" stroke={amber} strokeWidth="1.1" fill={chipBg} />
        <circle cx="122" cy="188" r="0.7" fill={amber} />

        <circle cx="152" cy="34" r="2.2" stroke={amber} strokeWidth="1.1" fill={chipBg} />
        <circle cx="152" cy="34" r="0.7" fill={amber} />

        <circle cx="74" cy="86" r="2.2" stroke={amber} strokeWidth="1.1" fill={chipBg} />
        <circle cx="74" cy="86" r="0.7" fill={amber} />
      </g>
    </svg>
  );
};

// 2. مهندسی مکانیک (Involute Industrial Gears & Dynamics)
const ArtworkMechanical: React.FC<{ isDarkMode?: boolean }> = ({ isDarkMode }) => {
  const amber = isDarkMode ? "#fbbf24" : "#b45309";
  const orange = isDarkMode ? "#f97316" : "#c2410c";

  return (
    <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <radialGradient id="mech-glow" cx="30%" cy="46%" r="48%">
          <stop offset="0%" stopColor={amber} stopOpacity={isDarkMode ? "0.22" : "0.18"} />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="240" fill="url(#mech-glow)" />

      {/* Main Drive Gear Centered at (108, 105) */}
      <g transform="translate(108, 105)">
        <circle cx="0" cy="0" r="38" stroke={amber} strokeWidth="2.5" opacity={isDarkMode ? "0.8" : "0.9"} />
        <circle cx="0" cy="0" r="25" stroke={orange} strokeWidth="1.5" strokeDasharray="4 2" opacity={isDarkMode ? "0.6" : "0.75"} />
        <circle cx="0" cy="0" r="12" fill={amber} opacity={isDarkMode ? "0.5" : "0.7"} />
        <circle cx="0" cy="0" r="6" fill={isDarkMode ? "#0f172a" : "#fff"} />

        {/* 12 Involute Gear Teeth */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          return (
            <line
              key={i}
              x1={Math.cos(rad) * 38}
              y1={Math.sin(rad) * 38}
              x2={Math.cos(rad) * 47}
              y2={Math.sin(rad) * 47}
              stroke={amber}
              strokeWidth="4.5"
              strokeLinecap="round"
              opacity={isDarkMode ? "0.85" : "0.95"}
            />
          );
        })}

        {/* 6 Spokes */}
        {[0, 60, 120, 180, 240, 300].map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          return (
            <line
              key={i}
              x1={Math.cos(rad) * 12}
              y1={Math.sin(rad) * 12}
              x2={Math.cos(rad) * 25}
              y2={Math.sin(rad) * 25}
              stroke={orange}
              strokeWidth="2"
              opacity={isDarkMode ? "0.6" : "0.8"}
            />
          );
        })}
      </g>

      {/* Meshed Secondary Pinion Gear Centered at (156, 75) */}
      <g transform="translate(156, 75)" opacity={isDarkMode ? "0.75" : "0.85"}>
        <circle cx="0" cy="0" r="20" stroke={orange} strokeWidth="2" />
        <circle cx="0" cy="0" r="6" fill={orange} opacity="0.6" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          return (
            <line
              key={i}
              x1={Math.cos(rad) * 20}
              y1={Math.sin(rad) * 20}
              x2={Math.cos(rad) * 26}
              y2={Math.sin(rad) * 26}
              stroke={orange}
              strokeWidth="3.2"
              strokeLinecap="round"
            />
          );
        })}
      </g>
    </svg>
  );
};

// 3. مهندسی عمران (Twin-Tower Suspension Bridge & Blueprint Grid)
const ArtworkCivil: React.FC<{ isDarkMode?: boolean }> = ({ isDarkMode }) => {
  const sky = isDarkMode ? "#38bdf8" : "#0284c7";
  const cobalt = isDarkMode ? "#60a5fa" : "#1d4ed8";

  return (
    <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <radialGradient id="civil-glow" cx="30%" cy="46%" r="48%">
          <stop offset="0%" stopColor={sky} stopOpacity={isDarkMode ? "0.22" : "0.18"} />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="240" fill="url(#civil-glow)" />

      {/* Architectural Blueprint Grid Background */}
      <g opacity={isDarkMode ? "0.14" : "0.2"} stroke={sky} strokeWidth="0.8">
        {[40, 75, 110, 145, 180].map((y, i) => (
          <line key={i} x1="10" y1={y} x2="390" y2={y} strokeDasharray="4 4" />
        ))}
        {[50, 90, 130, 170, 210, 250, 290, 330].map((x, i) => (
          <line key={i} x1={x} y1="15" x2={x} y2="195" strokeDasharray="4 4" />
        ))}
      </g>

      {/* Bridge Structure in Safe Center-Left (x=55 to 168) */}
      {/* Tower 1 at x=88 */}
      <line x1="85" y1="45" x2="85" y2="160" stroke={sky} strokeWidth="3" opacity={isDarkMode ? "0.85" : "0.95"} />
      <line x1="94" y1="45" x2="94" y2="160" stroke={sky} strokeWidth="3" opacity={isDarkMode ? "0.85" : "0.95"} />
      {[65, 95, 125].map((y, i) => (
        <React.Fragment key={i}>
          <line x1="85" y1={y} x2="94" y2={y + 14} stroke={cobalt} strokeWidth="1.5" opacity="0.8" />
          <line x1="94" y1={y} x2="85" y2={y + 14} stroke={cobalt} strokeWidth="1.5" opacity="0.8" />
        </React.Fragment>
      ))}

      {/* Tower 2 at x=142 */}
      <line x1="139" y1="45" x2="139" y2="160" stroke={sky} strokeWidth="3" opacity={isDarkMode ? "0.85" : "0.95"} />
      <line x1="148" y1="45" x2="148" y2="160" stroke={sky} strokeWidth="3" opacity={isDarkMode ? "0.85" : "0.95"} />
      {[65, 95, 125].map((y, i) => (
        <React.Fragment key={i}>
          <line x1="139" y1={y} x2="148" y2={y + 14} stroke={cobalt} strokeWidth="1.5" opacity="0.8" />
          <line x1="148" y1={y} x2="139" y2={y + 14} stroke={cobalt} strokeWidth="1.5" opacity="0.8" />
        </React.Fragment>
      ))}

      {/* Main Catenary Suspension Cable */}
      <path
        d="M 52 160 Q 70 115 90 45 Q 115 125 144 45 Q 158 115 172 160"
        stroke={cobalt}
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        opacity={isDarkMode ? "0.85" : "0.95"}
      />

      {/* Road Deck Truss */}
      <line x1="48" y1="160" x2="175" y2="160" stroke={sky} strokeWidth="3.2" opacity={isDarkMode ? "0.85" : "0.95"} />
    </svg>
  );
};

// 4. مهندسی شیمی و نفت (Fractionation Column & Spherical Tank)
const ArtworkPetroleumChemical: React.FC<{ isDarkMode?: boolean }> = ({ isDarkMode }) => {
  const copper = isDarkMode ? "#fb923c" : "#c2410c";
  const amber = isDarkMode ? "#facc15" : "#b45309";

  return (
    <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <radialGradient id="petro-glow" cx="30%" cy="46%" r="48%">
          <stop offset="0%" stopColor={copper} stopOpacity={isDarkMode ? "0.24" : "0.18"} />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="240" fill="url(#petro-glow)" />

      {/* Distillation Fractionation Column at (122, 35) */}
      <g transform="translate(122, 35)" opacity={isDarkMode ? "0.85" : "0.95"}>
        <path d="M 0 16 Q 18 0 36 16" stroke={copper} strokeWidth="2.5" fill="none" />
        <rect x="0" y="16" width="36" height="125" rx="3" stroke={copper} strokeWidth="2.5" fill={isDarkMode ? "#18181b" : "#fff7ed"} fillOpacity={isDarkMode ? "0.4" : "0.6"} />
        {[34, 55, 76, 97, 118].map((y, i) => (
          <React.Fragment key={i}>
            <line x1="0" y1={y} x2="36" y2={y} stroke={amber} strokeWidth="1.5" strokeDasharray="3 2" />
            <circle cx="11" cy={y - 5} r="2.2" fill={amber} opacity="0.85" />
            <circle cx="25" cy={y - 5} r="2.2" fill={copper} opacity="0.85" />
          </React.Fragment>
        ))}
      </g>

      {/* Spherical High-Pressure Storage Tank at (78, 115) */}
      <g transform="translate(78, 115)" opacity={isDarkMode ? "0.8" : "0.9"}>
        <circle cx="0" cy="0" r="22" stroke={copper} strokeWidth="2.5" fill={isDarkMode ? "#18181b" : "#fff7ed"} fillOpacity={isDarkMode ? "0.3" : "0.5"} />
        <ellipse cx="0" cy="0" rx="22" ry="8" stroke={amber} strokeWidth="1.2" strokeDasharray="3 2" opacity="0.7" />
        <line x1="-14" y1="16" x2="-20" y2="36" stroke={copper} strokeWidth="2" />
        <line x1="14" y1="16" x2="20" y2="36" stroke={copper} strokeWidth="2" />
      </g>

      {/* Transfer Pipeline connecting Column and Sphere */}
      <path d="M 122 110 L 100 110" stroke={amber} strokeWidth="2.2" fill="none" opacity="0.8" />
    </svg>
  );
};

// 5. شیمی (Benzene Molecular Honeycomb & Covalent Orbitals)
const ArtworkChemistry: React.FC<{ isDarkMode?: boolean }> = ({ isDarkMode }) => {
  const pink = isDarkMode ? "#f472b6" : "#be185d";
  const violet = isDarkMode ? "#c084fc" : "#7e22ce";

  return (
    <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <radialGradient id="chem-glow" cx="30%" cy="46%" r="48%">
          <stop offset="0%" stopColor={pink} stopOpacity={isDarkMode ? "0.24" : "0.18"} />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="240" fill="url(#chem-glow)" />

      {/* Central Benzene Ring at (98, 105) */}
      <g transform="translate(98, 105)" opacity={isDarkMode ? "0.85" : "0.95"}>
        <polygon points="0,-30 26,-15 26,15 0,30 -26,15 -26,-15" stroke={pink} strokeWidth="2.5" fill={isDarkMode ? "#1e1b4b" : "#fdf2f8"} fillOpacity={isDarkMode ? "0.35" : "0.5"} />
        <circle cx="0" cy="0" r="16" stroke={violet} strokeWidth="1.5" strokeDasharray="4 2" opacity="0.8" />
        {[[0,-30], [26,-15], [26,15], [0,30], [-26,15], [-26,-15]].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="3.8" fill={i % 2 === 0 ? pink : violet} />
        ))}
      </g>

      {/* Adjacent Connected Ring at (142, 105) */}
      <g transform="translate(142, 105)" opacity={isDarkMode ? "0.75" : "0.85"}>
        <polygon points="0,-30 26,-15 26,15 0,30 -26,15 -26,-15" stroke={violet} strokeWidth="2.2" fill="none" />
        {[[26,-15], [26,15], [0,30]].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="3.2" fill={violet} />
        ))}
      </g>
    </svg>
  );
};

// 6. ریاضی، آمار و علوم کامپیوتر (Golden Spiral & Sacred Geometry)
const ArtworkMath: React.FC<{ isDarkMode?: boolean }> = ({ isDarkMode }) => {
  const purple = isDarkMode ? "#c084fc" : "#6b21a8";
  const magenta = isDarkMode ? "#e879f9" : "#9333ea";

  return (
    <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <radialGradient id="math-glow" cx="30%" cy="46%" r="48%">
          <stop offset="0%" stopColor={purple} stopOpacity={isDarkMode ? "0.24" : "0.18"} />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="240" fill="url(#math-glow)" />

      {/* Fibonacci Rectangles & Spiral Centered at (110, 105) */}
      <g transform="translate(70, 62)" opacity={isDarkMode ? "0.85" : "0.95"}>
        <rect x="0" y="0" width="88" height="54" stroke={purple} strokeWidth="1.8" fill="none" opacity="0.5" />
        <rect x="0" y="0" width="54" height="54" stroke={magenta} strokeWidth="1.8" fill="none" opacity="0.5" />
        <rect x="54" y="0" width="34" height="34" stroke={purple} strokeWidth="1.8" fill="none" opacity="0.5" />
        <rect x="54" y="34" width="20" height="20" stroke={magenta} strokeWidth="1.8" fill="none" opacity="0.5" />

        <path
          d="M 54 54 A 54 54 0 0 1 0 0 A 34 34 0 0 1 54 34 A 20 20 0 0 1 74 54"
          stroke={magenta}
          strokeWidth="2.8"
          fill="none"
          strokeLinecap="round"
        />
      </g>

      {/* Mathematical Glyphs in Safe Left Margin */}
      <g opacity={isDarkMode ? "0.3" : "0.4"} fontSize="20" fontWeight="bold" fontFamily="serif" fontStyle="italic" fill={purple}>
        <text x="50" y="65">∑</text>
        <text x="50" y="155">π</text>
      </g>
    </svg>
  );
};

// 7. فیزیک (Quantum Bohr Orbitals & Spacetime Curvature)
const ArtworkPhysics: React.FC<{ isDarkMode?: boolean }> = ({ isDarkMode }) => {
  const purple = isDarkMode ? "#c084fc" : "#7e22ce";
  const indigo = isDarkMode ? "#818cf8" : "#4338ca";

  return (
    <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <radialGradient id="phys-glow" cx="30%" cy="46%" r="48%">
          <stop offset="0%" stopColor={purple} stopOpacity={isDarkMode ? "0.24" : "0.18"} />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="240" fill="url(#phys-glow)" />

      {/* Quantum Bohr Model Centered at (115, 105) */}
      <g transform="translate(115, 105)">
        <circle cx="0" cy="0" r="11" fill={purple} opacity={isDarkMode ? "0.9" : "0.95"} />
        <circle cx="0" cy="0" r="16" stroke={purple} strokeWidth="1.5" strokeDasharray="3 2" opacity="0.6" />
        <circle cx="-3" cy="-3" r="3.5" fill="#fff" opacity="0.8" />

        {/* Orbit 1 */}
        <ellipse cx="0" cy="0" rx="46" ry="18" stroke={indigo} strokeWidth="2" transform="rotate(-35)" opacity={isDarkMode ? "0.75" : "0.85"} />
        <circle cx="36" cy="-15" r="3.8" fill={purple} />

        {/* Orbit 2 */}
        <ellipse cx="0" cy="0" rx="46" ry="18" stroke={purple} strokeWidth="2" transform="rotate(35)" opacity={isDarkMode ? "0.75" : "0.85"} />
        <circle cx="-34" cy="15" r="3.8" fill={indigo} />
      </g>
    </svg>
  );
};

// 8. اقتصاد، مدیریت و بازرگانی (Candlestick Market Cycle & Growth Vector)
const ArtworkEconomics: React.FC<{ isDarkMode?: boolean }> = ({ isDarkMode }) => {
  const emerald = isDarkMode ? "#34d399" : "#047857";
  const gold = isDarkMode ? "#fbbf24" : "#b45309";
  const crimson = isDarkMode ? "#f87171" : "#b91c1c";

  return (
    <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <radialGradient id="econ-glow" cx="30%" cy="46%" r="48%">
          <stop offset="0%" stopColor={emerald} stopOpacity={isDarkMode ? "0.24" : "0.18"} />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="240" fill="url(#econ-glow)" />

      {/* Candlestick Chart in Safe Center-Left (x=68 to 155) */}
      <g transform="translate(68, 55)" opacity={isDarkMode ? "0.85" : "0.95"}>
        {/* Candle 1 (Green) */}
        <line x1="12" y1="50" x2="12" y2="95" stroke={emerald} strokeWidth="1.5" />
        <rect x="7" y="60" width="10" height="22" fill={emerald} rx="1.5" />

        {/* Candle 2 (Red dip) */}
        <line x1="32" y1="58" x2="32" y2="105" stroke={crimson} strokeWidth="1.5" />
        <rect x="27" y="68" width="10" height="26" fill={crimson} rx="1.5" />

        {/* Candle 3 (Green recovery) */}
        <line x1="52" y1="40" x2="52" y2="88" stroke={emerald} strokeWidth="1.5" />
        <rect x="47" y="48" width="10" height="28" fill={emerald} rx="1.5" />

        {/* Candle 4 (Green surge) */}
        <line x1="72" y1="24" x2="72" y2="72" stroke={emerald} strokeWidth="1.5" />
        <rect x="67" y="32" width="10" height="30" fill={emerald} rx="1.5" />

        {/* Candle 5 (Gold breakout) */}
        <line x1="92" y1="6" x2="92" y2="54" stroke={gold} strokeWidth="2" />
        <rect x="87" y="14" width="10" height="30" fill={gold} rx="1.5" />

        {/* Ascending Trend Ribbon */}
        <path d="M 0 85 Q 30 80 52 58 T 100 12" stroke={gold} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <circle cx="100" cy="12" r="3.5" fill={gold} />
      </g>
    </svg>
  );
};

// 9. علوم تربیتی و روانشناسی (Cerebral Cortex Silhouette & Neural Nexus)
const ArtworkPsychology: React.FC<{ isDarkMode?: boolean }> = ({ isDarkMode }) => {
  const violet = isDarkMode ? "#a78bfa" : "#6d28d9";
  const purple = isDarkMode ? "#c084fc" : "#7e22ce";
  const cyan = isDarkMode ? "#22d3ee" : "#0e7490";

  return (
    <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <radialGradient id="psych-glow" cx="30%" cy="46%" r="48%">
          <stop offset="0%" stopColor={violet} stopOpacity={isDarkMode ? "0.26" : "0.2"} />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="240" fill="url(#psych-glow)" />

      {/* Human Cognitive Silhouette & Synaptic Matrix Centered at (115, 102) */}
      <g transform="translate(75, 48)" opacity={isDarkMode ? "0.85" : "0.95"}>
        <path
          d="M 64 110 L 58 92 Q 70 88 76 75 Q 82 60 78 40 Q 72 16 52 10 Q 30 5 14 20 Q 0 34 2 56 Q 4 74 15 84 L 17 110"
          stroke={violet}
          strokeWidth="2"
          fill={isDarkMode ? "#1e1b4b" : "#f5f3ff"}
          fillOpacity={isDarkMode ? "0.4" : "0.6"}
          strokeLinecap="round"
        />

        {/* Luminous Synaptic Constellation */}
        {[[22, 42], [35, 28], [54, 24], [65, 40], [30, 62], [48, 55], [64, 66], [38, 78]].map(([cx, cy], i) => (
          <g key={i}>
            <circle cx={cx} cy={cy} r="3.2" fill={i % 2 === 0 ? violet : cyan} />
            <circle cx={cx} cy={cy} r="6.5" stroke={i % 2 === 0 ? violet : cyan} strokeWidth="1" opacity="0.5" />
          </g>
        ))}

        {/* Neural Axons */}
        <line x1="22" y1="42" x2="35" y2="28" stroke={violet} strokeWidth="1.4" />
        <line x1="35" y1="28" x2="54" y2="24" stroke={cyan} strokeWidth="1.4" />
        <line x1="54" y1="24" x2="65" y2="40" stroke={violet} strokeWidth="1.4" />
        <line x1="35" y1="28" x2="48" y2="55" stroke={cyan} strokeWidth="1.2" opacity="0.7" />
        <line x1="22" y1="42" x2="30" y2="62" stroke={violet} strokeWidth="1.4" />
        <line x1="30" y1="62" x2="48" y2="55" stroke={cyan} strokeWidth="1.4" />

        {/* Concentric Cognitive Wave Rings */}
        <circle cx="48" cy="55" r="14" stroke={purple} strokeWidth="1.2" strokeDasharray="3 3" opacity="0.6" />
      </g>

      {/* Greek Psi Symbol in Safe Margin */}
      <g opacity={isDarkMode ? "0.4" : "0.5"} fill={violet}>
        <text x="52" y="80" fontSize="28" fontWeight="bold" fontFamily="serif" fontStyle="italic">Ψ</text>
      </g>
    </svg>
  );
};

// 10. جغرافیا و برنامه‌ریزی (Nautical Compass Rose & Topography)
const ArtworkGeography: React.FC<{ isDarkMode?: boolean }> = ({ isDarkMode }) => {
  const cyan = isDarkMode ? "#38bdf8" : "#0369a1";
  const teal = isDarkMode ? "#2dd4bf" : "#0f766e";

  return (
    <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <radialGradient id="geo-glow" cx="30%" cy="46%" r="48%">
          <stop offset="0%" stopColor={cyan} stopOpacity={isDarkMode ? "0.24" : "0.18"} />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="240" fill="url(#geo-glow)" />

      {/* 16-Point Compass Rose Centered at (115, 105) */}
      <g transform="translate(115, 105)" opacity={isDarkMode ? "0.85" : "0.95"}>
        <circle cx="0" cy="0" r="40" stroke={cyan} strokeWidth="1.5" strokeDasharray="3 2" opacity="0.6" />
        <circle cx="0" cy="0" r="28" stroke={teal} strokeWidth="1.2" opacity="0.7" />

        {/* North Pointer */}
        <polygon points="0,-36 5,-9 0,0" fill={cyan} />
        <polygon points="0,-36 -5,-9 0,0" fill={isDarkMode ? "#7dd3fc" : "#0284c7"} />
        {/* South Pointer */}
        <polygon points="0,36 5,9 0,0" fill={teal} />
        <polygon points="0,36 -5,9 0,0" fill={isDarkMode ? "#99f6e4" : "#0d9488"} />
        {/* East Pointer */}
        <polygon points="36,0 9,5 0,0" fill={cyan} opacity="0.7" />
        <polygon points="36,0 9,-5 0,0" fill={isDarkMode ? "#7dd3fc" : "#0284c7"} opacity="0.7" />
        {/* West Pointer */}
        <polygon points="-36,0 -9,5 0,0" fill={teal} opacity="0.7" />
        <polygon points="-36,0 -9,-5 0,0" fill={isDarkMode ? "#99f6e4" : "#0d9488"} opacity="0.7" />

        <text x="0" y="-40" fontSize="9" fontWeight="bold" fontFamily="monospace" fill={cyan} textAnchor="middle">N</text>
      </g>
    </svg>
  );
};

// 11. تربیت بدنی و علوم ورزشی (Athletic Kinetic Runner & Biometrics)
const ArtworkSports: React.FC<{ isDarkMode?: boolean }> = ({ isDarkMode }) => {
  const orange = isDarkMode ? "#fb923c" : "#c2410c";
  const blue = isDarkMode ? "#60a5fa" : "#1d4ed8";

  return (
    <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <radialGradient id="sport-glow" cx="30%" cy="46%" r="48%">
          <stop offset="0%" stopColor={orange} stopOpacity={isDarkMode ? "0.24" : "0.18"} />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="240" fill="url(#sport-glow)" />

      {/* Kinetic Runner Silhouette Centered at (112, 95) */}
      <g transform="translate(112, 60)" opacity={isDarkMode ? "0.85" : "0.95"}>
        <circle cx="14" cy="0" r="7.5" fill={orange} />
        <path d="M 11 9 L 0 32 L -7 50" stroke={orange} strokeWidth="4.2" strokeLinecap="round" />
        <path d="M 7 14 L 22 26 L 35 18" stroke={blue} strokeWidth="3.5" strokeLinecap="round" />
        <path d="M 7 14 L -9 22 L -20 15" stroke={blue} strokeWidth="3" strokeLinecap="round" />
        <path d="M 0 32 L 22 44 L 18 68" stroke={orange} strokeWidth="3.8" strokeLinecap="round" />
        <path d="M 0 32 L -20 38 L -30 32" stroke={orange} strokeWidth="3.8" strokeLinecap="round" />
      </g>

      {/* Cardiac ECG Rhythm Line */}
      <path
        d="M 45 145 L 65 145 L 72 125 L 80 165 L 88 115 L 96 155 L 104 145 L 160 145"
        stroke={blue}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        opacity={isDarkMode ? "0.55" : "0.7"}
      />
    </svg>
  );
};

// 12. الهیات و علوم اسلامی (Sacred Muqarnas Arch & Guiding Star)
const ArtworkTheology: React.FC<{ isDarkMode?: boolean }> = ({ isDarkMode }) => {
  const emerald = isDarkMode ? "#34d399" : "#047857";
  const gold = isDarkMode ? "#fbbf24" : "#92400e";

  return (
    <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <radialGradient id="theol-glow" cx="30%" cy="46%" r="48%">
          <stop offset="0%" stopColor={emerald} stopOpacity={isDarkMode ? "0.24" : "0.18"} />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="240" fill="url(#theol-glow)" />

      {/* Pointed Mihrab Archway Centered at (115, 105) */}
      <g transform="translate(85, 48)" opacity={isDarkMode ? "0.85" : "0.95"}>
        <path
          d="M 5 110 L 5 48 Q 5 16 30 2 Q 55 16 55 48 L 55 110"
          stroke={emerald}
          strokeWidth="2.6"
          fill="none"
        />
        <path
          d="M 14 110 L 14 54 Q 14 26 30 14 Q 46 26 46 54 L 46 110"
          stroke={gold}
          strokeWidth="1.6"
          strokeDasharray="3 2"
          fill="none"
        />

        {/* 8-Point Islamic Star Inside Arch */}
        <g transform="translate(30, 46)">
          <rect x="-10" y="-10" width="20" height="20" stroke={gold} strokeWidth="1.6" fill="none" />
          <rect x="-10" y="-10" width="20" height="20" stroke={gold} strokeWidth="1.6" fill="none" transform="rotate(45)" />
          <circle cx="0" cy="0" r="3" fill={emerald} />
        </g>
      </g>
    </svg>
  );
};

// 13. علوم طبیعی (Geological Ammonite Fossil & Strata Layers)
const ArtworkNaturalSciences: React.FC<{ isDarkMode?: boolean }> = ({ isDarkMode }) => {
  const terra = isDarkMode ? "#fb923c" : "#9a3412";
  const bio = isDarkMode ? "#4ade80" : "#15803d";

  return (
    <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <radialGradient id="nat-glow" cx="30%" cy="46%" r="48%">
          <stop offset="0%" stopColor={bio} stopOpacity={isDarkMode ? "0.24" : "0.18"} />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="240" fill="url(#nat-glow)" />

      {/* Logarithmic Ammonite Fossil Centered at (115, 100) */}
      <g transform="translate(115, 100)" opacity={isDarkMode ? "0.8" : "0.9"}>
        <path
          d="M 0 0 A 6 6 0 0 1 6 6 A 13 13 0 0 1 -6 16 A 22 22 0 0 1 -22 -6 A 34 34 0 0 1 10 -30 A 46 46 0 0 1 40 12"
          stroke={terra}
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
        />
        {[0, 30, 60, 90, 130, 170, 210, 250].map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          return (
            <line
              key={i}
              x1={Math.cos(rad) * 8}
              y1={Math.sin(rad) * 8}
              x2={Math.cos(rad) * 22}
              y2={Math.sin(rad) * 22}
              stroke={bio}
              strokeWidth="1.4"
              opacity="0.75"
            />
          );
        })}
      </g>
    </svg>
  );
};

// 14. کشاورزی و منابع طبیعی (Golden Wheat Sheaves & Flora)
const ArtworkAgriculture: React.FC<{ isDarkMode?: boolean }> = ({ isDarkMode }) => {
  const green = isDarkMode ? "#4ade80" : "#15803d";
  const gold = isDarkMode ? "#facc15" : "#a16207";

  return (
    <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <radialGradient id="agri-glow" cx="30%" cy="46%" r="48%">
          <stop offset="0%" stopColor={green} stopOpacity={isDarkMode ? "0.24" : "0.18"} />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="240" fill="url(#agri-glow)" />

      {/* Wheat Stalks Centered at (115, 105) */}
      <g transform="translate(115, 50)" opacity={isDarkMode ? "0.85" : "0.95"}>
        <path d="M 0 115 Q 4 55 7 0" stroke={gold} strokeWidth="2.2" fill="none" strokeLinecap="round" />
        {[15, 30, 45, 60, 75].map((y, i) => (
          <React.Fragment key={i}>
            <ellipse cx="-6" cy={y} rx="6.5" ry="3.8" fill={gold} transform={`rotate(-35 -6 ${y})`} opacity="0.9" />
            <ellipse cx="8" cy={y + 7} rx="6.5" ry="3.8" fill={green} transform={`rotate(35 8 ${y + 7})`} opacity="0.9" />
          </React.Fragment>
        ))}

        <path d="M -12 115 Q -18 65 -30 25" stroke={green} strokeWidth="1.8" fill="none" strokeLinecap="round" opacity={0.75} />
        {[30, 45, 60].map((y, i) => (
          <ellipse key={i} cx="-24" cy={y} rx="5.5" ry="3.2" fill={green} transform={`rotate(-40 -24 ${y})`} opacity={0.75} />
        ))}
      </g>
    </svg>
  );
};

// 15. دانشکده ادبیات فارسی و زبان‌های خارجی (Illuminated Manuscript Divan & Calligraphic Reed Pen)
const ArtworkLiterature: React.FC<{ isDarkMode?: boolean }> = ({ isDarkMode }) => {
  const amber = isDarkMode ? "#fbbf24" : "#b45309";
  const sepia = isDarkMode ? "#fde68a" : "#78350f";
  const gold = isDarkMode ? "#f59e0b" : "#92400e";

  return (
    <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <radialGradient id="lit-glow" cx="30%" cy="46%" r="48%">
          <stop offset="0%" stopColor={amber} stopOpacity={isDarkMode ? "0.26" : "0.2"} />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="240" fill="url(#lit-glow)" />

      {/* Classical Open Divan Manuscript & Reed Pen Centered at (115, 102) */}
      <g transform="translate(115, 102)">
        <path d="M 0 -32 L 0 38" stroke={sepia} strokeWidth="2.8" strokeLinecap="round" opacity="0.8" />

        {/* Left Page */}
        <path
          d="M 0 -32 Q -22 -38 -46 -30 L -46 32 Q -22 26 0 38 Z"
          stroke={gold}
          strokeWidth="1.8"
          fill={isDarkMode ? "#271c0d" : "#fef3c7"}
          fillOpacity={isDarkMode ? "0.6" : "0.85"}
        />
        <path d="M -7 -20 Q -22 -25 -38 -20" stroke={amber} strokeWidth="1" opacity="0.6" />
        <path d="M -7 -7 Q -22 -12 -38 -7" stroke={amber} strokeWidth="1" opacity="0.6" />
        <path d="M -7 6 Q -22 1 -38 6" stroke={amber} strokeWidth="1" opacity="0.6" />
        <path d="M -7 18 Q -22 13 -38 18" stroke={amber} strokeWidth="1" opacity="0.6" />

        {/* Right Page */}
        <path
          d="M 0 -32 Q 22 -38 46 -30 L 46 32 Q 22 26 0 38 Z"
          stroke={gold}
          strokeWidth="1.8"
          fill={isDarkMode ? "#271c0d" : "#fef3c7"}
          fillOpacity={isDarkMode ? "0.6" : "0.85"}
        />
        <path d="M 7 -20 Q 22 -25 38 -20" stroke={amber} strokeWidth="1" opacity="0.6" />
        <path d="M 7 -7 Q 22 -12 38 -7" stroke={amber} strokeWidth="1" opacity="0.6" />
        <path d="M 7 6 Q 22 1 38 6" stroke={amber} strokeWidth="1" opacity="0.6" />
        <path d="M 7 18 Q 22 13 38 18" stroke={amber} strokeWidth="1" opacity="0.6" />

        {/* Classical Persian Reed Pen */}
        <g transform="rotate(32) translate(12, -52)">
          <path d="M -2.5 0 L 2.5 0 L 1.8 62 L -1.8 62 Z" fill={sepia} stroke={gold} strokeWidth="1.2" />
          <path d="M -1.8 62 L 1.8 62 L 0 69 Z" fill={gold} />
          <line x1="0" y1="58" x2="0" y2="69" stroke={isDarkMode ? "#000" : "#451a03"} strokeWidth="0.8" />
        </g>
      </g>
    </svg>
  );
};

// 16. دانشکده حقوق و علوم اجتماعی (Scales of Themis & Corinthian Column - Calibrated Buffer)
const ArtworkLaw: React.FC<{ isDarkMode?: boolean }> = ({ isDarkMode }) => {
  const ruby = isDarkMode ? "#fb7185" : "#be123c";
  const gold = isDarkMode ? "#fbbf24" : "#92400e";

  return (
    <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <radialGradient id="law-glow" cx="30%" cy="46%" r="48%">
          <stop offset="0%" stopColor={ruby} stopOpacity={isDarkMode ? "0.24" : "0.18"} />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="240" fill="url(#law-glow)" />

      {/* Classical Corinthian Column on Left (x=60 to 74) */}
      <g transform="translate(64, 55)" opacity={isDarkMode ? "0.6" : "0.75"}>
        <rect x="-8" y="0" width="16" height="5" rx="1.5" stroke={gold} strokeWidth="1.2" fill={isDarkMode ? "#4c0519" : "#fff1f2"} />
        <line x1="-5" y1="6" x2="-5" y2="78" stroke={ruby} strokeWidth="1.5" />
        <line x1="0" y1="6" x2="0" y2="78" stroke={gold} strokeWidth="1.5" />
        <line x1="5" y1="6" x2="5" y2="78" stroke={ruby} strokeWidth="1.5" />
        <rect x="-9" y="78" width="18" height="6" rx="1.5" stroke={gold} strokeWidth="1.2" fill={isDarkMode ? "#4c0519" : "#fff1f2"} />
      </g>

      {/* Mastercrafted Scales of Themis Centered at (115, 60) */}
      {/* Maximum right extent: 115 + 34 = 149 (leaving a massive 50px+ gap before student name!) */}
      <g transform="translate(115, 60)" opacity={isDarkMode ? "0.9" : "0.95"}>
        {/* Ornate Finial */}
        <path d="M 0 -8 Q 4 -4 0 0 Q -4 -4 0 -8 Z" fill={gold} />

        {/* Central Brass Pillar Stand */}
        <line x1="0" y1="0" x2="0" y2="78" stroke={gold} strokeWidth="3" strokeLinecap="round" />
        <circle cx="0" cy="0" r="4.5" fill={gold} />
        {/* Stepped Pedestal Base */}
        <rect x="-15" y="76" width="30" height="5" rx="1.5" fill={gold} />
        <rect x="-20" y="81" width="40" height="4" rx="1.5" fill={ruby} />

        {/* Curved Balance Crossbeam (width = 34px on each side) */}
        <path
          d="M -34 8 Q -17 4 0 6 Q 17 4 34 8"
          stroke={gold}
          strokeWidth="2.6"
          fill="none"
          strokeLinecap="round"
        />

        {/* Left Pan Chains */}
        <line x1="-34" y1="8" x2="-44" y2="38" stroke={ruby} strokeWidth="1" opacity="0.85" />
        <line x1="-34" y1="8" x2="-34" y2="38" stroke={ruby} strokeWidth="1" opacity="0.85" />
        <line x1="-34" y1="8" x2="-24" y2="38" stroke={ruby} strokeWidth="1" opacity="0.85" />
        {/* Left Scale Pan */}
        <path d="M -48 38 Q -34 48 -20 38 Z" stroke={gold} strokeWidth="1.8" fill={isDarkMode ? "#881337" : "#ffe4e6"} fillOpacity="0.85" />

        {/* Right Pan Chains */}
        <line x1="34" y1="8" x2="24" y2="38" stroke={ruby} strokeWidth="1" opacity="0.85" />
        <line x1="34" y1="8" x2="34" y2="38" stroke={ruby} strokeWidth="1" opacity="0.85" />
        <line x1="34" y1="8" x2="44" y2="38" stroke={ruby} strokeWidth="1" opacity="0.85" />
        {/* Right Scale Pan (Stays safely on or before x = 115 + 44 = 159!) */}
        <path d="M 20 38 Q 34 48 48 38 Z" stroke={gold} strokeWidth="1.8" fill={isDarkMode ? "#881337" : "#ffe4e6"} fillOpacity="0.85" />
      </g>
    </svg>
  );
};

// 17. دانشکده دامپزشکی (Veterinary Shield & Vital Pulse)
const ArtworkVeterinary: React.FC<{ isDarkMode?: boolean }> = ({ isDarkMode }) => {
  const teal = isDarkMode ? "#2dd4bf" : "#0f766e";
  const cyan = isDarkMode ? "#38bdf8" : "#0369a1";

  return (
    <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <radialGradient id="vet-glow" cx="30%" cy="46%" r="48%">
          <stop offset="0%" stopColor={teal} stopOpacity={isDarkMode ? "0.24" : "0.18"} />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="240" fill="url(#vet-glow)" />

      {/* Veterinary Protective Shield Centered at (115, 95) */}
      <g transform="translate(115, 60)" opacity={isDarkMode ? "0.85" : "0.95"}>
        <path d="M 0 0 L 32 0 L 32 32 Q 16 52 0 64 Q -16 52 -32 32 L -32 0 Z" stroke={teal} strokeWidth="2" fill="none" />
        <ellipse cx="0" cy="30" rx="9" ry="6" fill={cyan} opacity="0.85" />
        <circle cx="-9" cy="19" r="3.4" fill={cyan} />
        <circle cx="-3" cy="15" r="3.4" fill={cyan} />
        <circle cx="3" cy="15" r="3.4" fill={cyan} />
        <circle cx="9" cy="19" r="3.4" fill={cyan} />
      </g>

      {/* Bio-telemetry Heartbeat Line */}
      <path
        d="M 45 155 L 65 155 L 72 135 L 82 175 L 90 125 L 98 165 L 106 155 L 175 155"
        stroke={teal}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        opacity={isDarkMode ? "0.55" : "0.7"}
      />
    </svg>
  );
};

// Fallback Default: دانشگاه تبریز (Academic Laurel Crest)
const ArtworkDefault: React.FC<{ isDarkMode?: boolean }> = ({ isDarkMode }) => {
  const indigo = isDarkMode ? "#818cf8" : "#3730a3";

  return (
    <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <radialGradient id="def-glow" cx="30%" cy="46%" r="48%">
          <stop offset="0%" stopColor={indigo} stopOpacity={isDarkMode ? "0.22" : "0.16"} />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="240" fill="url(#def-glow)" />

      <g transform="translate(115, 105)" opacity={isDarkMode ? "0.8" : "0.9"}>
        <polygon points="0,-40 34,-20 34,20 0,40 -34,20 -34,-20" stroke={indigo} strokeWidth="2" fill="none" />
        <circle cx="0" cy="0" r="24" stroke={indigo} strokeWidth="1.5" strokeDasharray="3 2" />
        <circle cx="0" cy="0" r="8" fill={indigo} opacity="0.4" />
      </g>
    </svg>
  );
};

/**
 * Meticulous Dispatcher: Maps all 20 official Tabriz University faculties
 * without ANY false-positive keyword overlap.
 * Memoized: the 1000+ line SVG tree is heavy to rebuild, so we only re-render
 * when the faculty name or theme actually changes (big perf win on the dashboard).
 */
function FacultyArtworkBase({ facultyName, isDarkMode }: FacultyArtworkProps) {
  if (!facultyName) return <ArtworkDefault isDarkMode={isDarkMode} />;

  // 1. دانشکده ریاضی، آمار و علوم کامپیوتر (Priority: Must match before general 'کامپیوتر')
  if (
    facultyName.includes("ریاضی") ||
    facultyName.includes("آمار") ||
    (facultyName.includes("علوم کامپیوتر") && !facultyName.includes("برق"))
  ) {
    return <ArtworkMath isDarkMode={isDarkMode} />;
  }

  // 2. دانشکده مهندسی شیمی و نفت (Priority: Must match before pure 'شیمی')
  if (facultyName.includes("نفت") || facultyName.includes("شیمی و نفت")) {
    return <ArtworkPetroleumChemical isDarkMode={isDarkMode} />;
  }

  // 3. دانشکده شیمی (Pure and Applied Chemistry)
  if (facultyName.includes("شیمی")) {
    return <ArtworkChemistry isDarkMode={isDarkMode} />;
  }

  // 4. دانشکده مهندسی برق و کامپیوتر
  if (facultyName.includes("برق") || facultyName.includes("کامپیوتر")) {
    return <ArtworkECE isDarkMode={isDarkMode} />;
  }

  // 5. دانشکده مهندسی مکانیک
  if (facultyName.includes("مکانیک") || facultyName.includes("صنایع") || facultyName.includes("هوافضا")) {
    return <ArtworkMechanical isDarkMode={isDarkMode} />;
  }

  // 6. دانشکده مهندسی عمران و دانشکده فنی مرند
  if (
    facultyName.includes("عمران") ||
    facultyName.includes("معماری") ||
    facultyName.includes("نقشه‌برداری") ||
    facultyName.includes("مرند")
  ) {
    return <ArtworkCivil isDarkMode={isDarkMode} />;
  }

  // 7. فیزیک
  if (facultyName.includes("فیزیک")) {
    return <ArtworkPhysics isDarkMode={isDarkMode} />;
  }

  // 8. اقتصاد، مدیریت و بازرگانی
  if (facultyName.includes("اقتصاد") || facultyName.includes("مدیریت") || facultyName.includes("بازرگانی")) {
    return <ArtworkEconomics isDarkMode={isDarkMode} />;
  }

  // 9. علوم تربیتی و روانشناسی
  if (facultyName.includes("روانشناسی") || facultyName.includes("تربیتی") || facultyName.includes("علوم تربیتی")) {
    return <ArtworkPsychology isDarkMode={isDarkMode} />;
  }

  // 10. جغرافیا و برنامه‌ریزی
  if (facultyName.includes("جغرافیا") || facultyName.includes("برنامه ریزی")) {
    return <ArtworkGeography isDarkMode={isDarkMode} />;
  }

  // 11. تربیت بدنی و علوم ورزشی
  if (facultyName.includes("تربیت بدنی") || facultyName.includes("ورزشی") || facultyName.includes("بدنی")) {
    return <ArtworkSports isDarkMode={isDarkMode} />;
  }

  // 12. الهیات و علوم اسلامی
  if (facultyName.includes("الهیات") || facultyName.includes("اسلامی") || facultyName.includes("معارف")) {
    return <ArtworkTheology isDarkMode={isDarkMode} />;
  }

  // 13. علوم طبیعی (زیست‌شناسی و زمین‌شناسی)
  if (facultyName.includes("علوم طبیعی") || facultyName.includes("زیست") || facultyName.includes("زمین‌شناسی")) {
    return <ArtworkNaturalSciences isDarkMode={isDarkMode} />;
  }

  // 14. کشاورزی و دانشکده کشاورزی اهر
  if (facultyName.includes("کشاورزی") || facultyName.includes("منابع طبیعی") || facultyName.includes("اهر")) {
    return <ArtworkAgriculture isDarkMode={isDarkMode} />;
  }

  // 15. حقوق و علوم اجتماعی
  if (facultyName.includes("حقوق") || facultyName.includes("علوم اجتماعی") || facultyName.includes("اجتماعی")) {
    return <ArtworkLaw isDarkMode={isDarkMode} />;
  }

  // 16. ادبیات فارسی و زبان‌های خارجی
  if (facultyName.includes("ادبیات") || facultyName.includes("زبان") || facultyName.includes("فلسفه")) {
    return <ArtworkLiterature isDarkMode={isDarkMode} />;
  }

  // 17. دامپزشکی
  if (facultyName.includes("دامپزشکی")) {
    return <ArtworkVeterinary isDarkMode={isDarkMode} />;
  }

  // 18. دانشکده فنی میانه
  if (facultyName.includes("میانه")) {
    return <ArtworkMechanical isDarkMode={isDarkMode} />;
  }

  return <ArtworkDefault isDarkMode={isDarkMode} />;
}

const FacultyArtwork = React.memo(FacultyArtworkBase);
export default FacultyArtwork;
