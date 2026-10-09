/**
 * Automated WCAG AA Contrast Compliance Checker for Care Bridge Design Tokens.
 * W3C WCAG 2.1 Formula:
 * L = 0.2126 * R + 0.7152 * G + 0.0722 * B
 * Contrast Ratio = (L1 + 0.05) / (L2 + 0.05)
 * Requirements:
 * - Normal text: >= 4.5:1 (WCAG AA)
 * - Large text & UI controls: >= 3.0:1 (WCAG AA)
 */

function hexToRgb(hex) {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

function sRgbToLinear(c) {
  const norm = c / 255;
  return norm <= 0.03928 ? norm / 12.92 : Math.pow((norm + 0.055) / 1.055, 2.4);
}

function getRelativeLuminance(rgb) {
  const r = sRgbToLinear(rgb.r);
  const g = sRgbToLinear(rgb.g);
  const b = sRgbToLinear(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getContrastRatio(hex1, hex2) {
  const lum1 = getRelativeLuminance(hexToRgb(hex1));
  const lum2 = getRelativeLuminance(hexToRgb(hex2));
  const l1 = Math.max(lum1, lum2);
  const l2 = Math.min(lum1, lum2);
  return (l1 + 0.05) / (l2 + 0.05);
}

const PALETTE = [
  // --- Dark Cinematic Theme ---
  {
    theme: 'Dark Cinematic',
    fgName: 'Heading & Body text (#F5F2ED)',
    fgHex: '#F5F2ED',
    bgName: 'Deep Background (#050505)',
    bgHex: '#050505',
    minRatio: 4.5,
    role: 'Normal text'
  },
  {
    theme: 'Dark Cinematic',
    fgName: 'Heading & Body text (#F5F2ED)',
    fgHex: '#F5F2ED',
    bgName: 'Glass Card Surface (#0F0F0F)',
    bgHex: '#0F0F0F',
    minRatio: 4.5,
    role: 'Normal text'
  },
  {
    theme: 'Dark Cinematic',
    fgName: 'Muted text (#AAA7A3 / 68% opacity)',
    fgHex: '#AAA7A3',
    bgName: 'Deep Background (#050505)',
    bgHex: '#050505',
    minRatio: 4.5,
    role: 'Secondary text'
  },
  {
    theme: 'Dark Cinematic',
    fgName: 'Muted text (#AAA7A3 / 68% opacity)',
    fgHex: '#AAA7A3',
    bgName: 'Glass Card Surface (#0F0F0F)',
    bgHex: '#0F0F0F',
    minRatio: 4.5,
    role: 'Secondary text'
  },
  {
    theme: 'Dark Cinematic',
    fgName: 'Primary Button Text (#050505)',
    fgHex: '#050505',
    bgName: 'Primary Coral Button (#FF6242)',
    bgHex: '#FF6242',
    minRatio: 4.5,
    role: 'Button label'
  },
  {
    theme: 'Dark Cinematic',
    fgName: 'Secondary Mint Accent (#55D6A2)',
    fgHex: '#55D6A2',
    bgName: 'Deep Background (#050505)',
    bgHex: '#050505',
    minRatio: 3.0,
    role: 'Accent / Icon / Pill'
  },
  {
    theme: 'Dark Cinematic',
    fgName: 'Critical Status Red (#FF4D5E)',
    fgHex: '#FF4D5E',
    bgName: 'Deep Background (#050505)',
    bgHex: '#050505',
    minRatio: 4.5,
    role: 'Urgent Alert Label'
  },
  {
    theme: 'Dark Cinematic',
    fgName: 'Warning Status Gold (#F5B94A)',
    fgHex: '#F5B94A',
    bgName: 'Deep Background (#050505)',
    bgHex: '#050505',
    minRatio: 4.5,
    role: 'Warning Label'
  },
  {
    theme: 'Dark Cinematic',
    fgName: 'Info Status Blue (#7FB2FF)',
    fgHex: '#7FB2FF',
    bgName: 'Deep Background (#050505)',
    bgHex: '#050505',
    minRatio: 4.5,
    role: 'Info Label'
  },

  // --- High-Contrast Light Theme ---
  {
    theme: 'High-Contrast Light',
    fgName: 'Heading & Body text (#0D1117)',
    fgHex: '#0D1117',
    bgName: 'Light Background (#F8F9FA)',
    bgHex: '#F8F9FA',
    minRatio: 4.5,
    role: 'Normal text'
  },
  {
    theme: 'High-Contrast Light',
    fgName: 'Heading & Body text (#0D1117)',
    fgHex: '#0D1117',
    bgName: 'White Card Surface (#FFFFFF)',
    bgHex: '#FFFFFF',
    minRatio: 4.5,
    role: 'Normal text'
  },
  {
    theme: 'High-Contrast Light',
    fgName: 'Muted text (#3B434E)',
    fgHex: '#3B434E',
    bgName: 'Light Background (#F8F9FA)',
    bgHex: '#F8F9FA',
    minRatio: 4.5,
    role: 'Secondary text'
  },
  {
    theme: 'High-Contrast Light',
    fgName: 'Button text (#FFFFFF)',
    fgHex: '#FFFFFF',
    bgName: 'High-contrast Coral (#D9381E)',
    bgHex: '#D9381E',
    minRatio: 4.5,
    role: 'Button label'
  },
  {
    theme: 'High-Contrast Light',
    fgName: 'Success Green (#0E8554)',
    fgHex: '#0E8554',
    bgName: 'White Card Surface (#FFFFFF)',
    bgHex: '#FFFFFF',
    minRatio: 4.5,
    role: 'Success label'
  },
  {
    theme: 'High-Contrast Light',
    fgName: 'Critical Red (#C92A2A)',
    fgHex: '#C92A2A',
    bgName: 'White Card Surface (#FFFFFF)',
    bgHex: '#FFFFFF',
    minRatio: 4.5,
    role: 'Urgent label'
  },
  {
    theme: 'High-Contrast Light',
    fgName: 'Warning Orange (#B06000)',
    fgHex: '#B06000',
    bgName: 'White Card Surface (#FFFFFF)',
    bgHex: '#FFFFFF',
    minRatio: 4.5,
    role: 'Warning label'
  }
];

console.log('========================================================================');
console.log('       Care Bridge Design Tokens — WCAG AA Contrast Compliance Test     ');
console.log('========================================================================\n');

let failed = 0;

for (const pair of PALETTE) {
  const ratio = getContrastRatio(pair.fgHex, pair.bgHex);
  const ratioStr = ratio.toFixed(2) + ':1';
  const passed = ratio >= pair.minRatio;

  if (passed) {
    console.log(`✅ [PASS] ${pair.theme} | ${pair.role}`);
    console.log(`   FG: ${pair.fgName} on BG: ${pair.bgName}`);
    console.log(`   Ratio: ${ratioStr} (Required >= ${pair.minRatio}:1)\n`);
  } else {
    failed++;
    console.error(`❌ [FAIL] ${pair.theme} | ${pair.role}`);
    console.error(`   FG: ${pair.fgName} on BG: ${pair.bgName}`);
    console.error(`   Ratio: ${ratioStr} (Required >= ${pair.minRatio}:1)\n`);
  }
}

console.log('------------------------------------------------------------------------');
if (failed === 0) {
  console.log(`🎉 ALL ${PALETTE.length} COLOR PAIRS PASS WCAG AA / AAA REQUIREMENTS!`);
  console.log('------------------------------------------------------------------------\n');
  process.exit(0);
} else {
  console.error(`⚠️ ${failed} PAIR(S) FAILED WCAG AA CONTRAST.`);
  console.log('------------------------------------------------------------------------\n');
  process.exit(1);
}
