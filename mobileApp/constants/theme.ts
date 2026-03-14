// ═══════════════════════════════════════════════════════════════
// AEROSAFE Design System — Apple Minimalism
// Inspired by iOS Human Interface Guidelines
// ═══════════════════════════════════════════════════════════════

export const colors = {
  // ── Backgrounds ──────────────────────────────
  bg: '#F8F8FF',            // Ghost white - main background for better contrast
  bgSecondary: '#F2F2F7',   // iOS secondary background (grouped)
  bgTertiary: '#FFFFFF',    // iOS tertiary (cards on secondary bg)

  // ── Grouped backgrounds (for sections) ────────
  bgGrouped: '#F8F8FF',     // Main grouped background (ghost white)
  bgGroupedSecondary: '#FFFFFF', // Cards on grouped background

  // ── Card & elevated surfaces ──────────────────
  bgCard: '#FFFFFF',        // Pure white cards with shadows

  // ── Borders & separators ──────────────────────
  separator: 'rgba(60, 60, 67, 0.29)',  // iOS standard separator
  separatorOpaque: '#C6C6C8',           // Opaque version

  // ── Risk levels — iOS system colors ───────────
  critical: '#FF3B30',      // systemRed
  criticalBg: 'rgba(255, 59, 48, 0.08)',

  high: '#FF9500',          // systemOrange
  highBg: 'rgba(255, 149, 0, 0.08)',

  moderate: '#FFCC00',      // systemYellow
  moderateBg: 'rgba(255, 204, 0, 0.08)',

  low: '#34C759',           // systemGreen
  lowBg: 'rgba(52, 199, 89, 0.08)',

  // ── Text colors (iOS semantic) ────────────────
  label: '#000000',         // Primary text
  labelSecondary: '#3C3C43',   // Secondary text - solid for better readability
  labelTertiary: '#8E8E93',    // Tertiary text - lighter but still readable
  labelQuaternary: '#C7C7CC', // Quaternary text

  // ── Backward compatibility ────────────────────
  textPrimary: '#000000',
  textSecondary: '#3C3C43',
  textMuted: '#8E8E93',
  border: 'rgba(60, 60, 67, 0.29)',
  borderLight: '#C6C6C8',

  // ── Accent & interactive ──────────────────────
  accent: '#007AFF',        // systemBlue
  accentBlue: '#5AC8FA',    // systemTeal
  link: '#007AFF',

  // ── Sensor-specific colors ────────────────────
  tempColor: '#FF3B30',     // systemRed
  humidityColor: '#5AC8FA', // systemTeal
  vocColor: '#FF9500',      // systemOrange
  aqiColor: '#AF52DE',      // systemPurple

  // ── Overlays & effects ────────────────────────
  overlay: 'rgba(0, 0, 0, 0.4)',
  overlayLight: 'rgba(0, 0, 0, 0.2)',

  // ── Fill colors (for buttons, etc) ────────────
  fillPrimary: 'rgba(120, 120, 128, 0.2)',
  fillSecondary: 'rgba(120, 120, 128, 0.16)',
  fillTertiary: 'rgba(118, 118, 128, 0.12)',
};

// ── Typography System (SF Pro inspired) ───────────────────────
export const typography = {
  // Font families
  fontFamily: {
    system: 'System',       // Will use SF Pro on iOS, Roboto on Android
    systemBold: 'System',
    systemSemibold: 'System',
    systemMedium: 'System',
  },

  // Font sizes (iOS text styles)
  size: {
    largeTitle: 34,         // iOS Large Title
    title1: 28,             // iOS Title 1
    title2: 22,             // iOS Title 2
    title3: 20,             // iOS Title 3
    headline: 17,           // iOS Headline (semibold)
    body: 17,               // iOS Body
    callout: 16,            // iOS Callout
    subheadline: 15,        // iOS Subheadline
    footnote: 13,           // iOS Footnote
    caption1: 12,           // iOS Caption 1
    caption2: 11,           // iOS Caption 2
  },

  // Font weights
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    heavy: '800' as const,
  },

  // Line heights (calculated from iOS guidelines)
  lineHeight: {
    largeTitle: 41,
    title1: 34,
    title2: 28,
    title3: 25,
    headline: 22,
    body: 22,
    callout: 21,
    subheadline: 20,
    footnote: 18,
    caption1: 16,
    caption2: 13,
  },
};

// ── Spacing System (8pt grid) ─────────────────────────────────
export const spacing = {
  xxs: 2,    // 2pt - minimal
  xs: 4,     // 4pt - tight
  sm: 8,     // 8pt - compact
  md: 16,    // 16pt - standard (iOS default)
  lg: 24,    // 24pt - comfortable
  xl: 32,    // 32pt - spacious
  xxl: 40,   // 40pt - generous
  xxxl: 48,  // 48pt - extra generous
};

// ── Border Radius (iOS style) ─────────────────────────────────
export const radius = {
  xs: 4,     // Subtle
  sm: 8,     // Small elements
  md: 10,    // iOS default (cards, buttons)
  lg: 12,    // Larger cards
  xl: 16,    // Prominent elements
  xxl: 20,   // Extra prominent
  round: 999, // Fully rounded (pills)
};

// ── Shadows (iOS elevation) ───────────────────────────────────
export const shadows = {
  // iOS-style shadows - more visible on ghost white background
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2, // Android
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
};

// ── Backward compatibility (legacy naming) ────────────────────
export const font = {
  xs: 11,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 22,
  xxxl: 28,
};