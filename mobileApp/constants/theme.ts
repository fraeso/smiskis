export const colors = {
  // ── Backgrounds ──────────────────────────────
  bg: '#F8F8FF',           // ghost white
  bgCard: '#FFFFFF',        // elevated card surface
  bgCardAlt: '#F9F9F9',    // slightly off-white for nested surfaces

  // ── Borders ───────────────────────────────────
  border: '#E5E5EA',        // iOS separator
  borderLight: '#C7C7CC',   // iOS opaque separator (stronger)

  // ── Risk levels — Apple system palette ────────
  critical: '#FF3B30',      // iOS red
  criticalBg: '#FFF1F0',
  criticalBorder: '#FFCDD0',

  high: '#FF6B30',          // iOS orange-red blend
  highBg: '#FFF4EE',

  moderate: '#FF9F0A',      // iOS orange/amber
  moderateBg: '#FFF8EC',

  low: '#34C759',           // iOS green
  lowBg: '#EDFAF1',

  // ── Compatibility aliases ──────────────────────
  elevated: '#FF9F0A',
  elevatedBg: '#FFF8EC',
  normal: '#34C759',
  normalBg: '#EDFAF1',

  // ── Typography ────────────────────────────────
  textPrimary: '#000000',   // iOS label
  textSecondary: '#3C3C43', // iOS secondary label
  textMuted: '#8E8E93',     // iOS tertiary label / placeholder

  // ── Accent ────────────────────────────────────
  accent: '#007AFF',        // iOS blue
  accentBlue: '#5AC8FA',    // iOS light blue

  // ── Sensor-specific ───────────────────────────
  tempColor: '#FF3B30',     // red — heat
  humidityColor: '#5AC8FA', // light blue — water
  vocColor: '#FF9F0A',      // amber — chemical
  aqiColor: '#AF52DE',      // iOS purple — air quality
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
};

export const font = {
  xs: 11,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 22,
  xxxl: 28,
};