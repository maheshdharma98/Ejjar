// EJJAR Design System v1.0 — authoritative color tokens
// All screens import from here. Values match theme.ts exactly.
export const colors = {
  // ── Core brand ────────────────────────────────────────────────────────────
  brand:        '#E67E3A',   // orange — primary CTA / active state
  brandLight:   '#FEF3C7',   // warm tint (category chips, etc.)
  brandMuted:   '#D4692E',   // orange press / hover state
  brandDark:    '#101828',   // navy — headers and dark surfaces
  gold:         '#C9974A',   // gold — form field icons only

  // ── Teal (secondary actions) ──────────────────────────────────────────────
  teal400:      '#0369A1',
  teal200:      '#94A3B8',
  teal800:      '#101828',

  // ── Neutral surfaces ──────────────────────────────────────────────────────
  sand100: '#F8FAFC',   // page background
  sand50:  '#FFFFFF',   // card background
  sand200: '#F1F5F9',   // divider / pending badge bg
  sand300: '#E2E8F0',   // all borders

  // ── Backgrounds that are now just nav tokens ───────────────────────────────
  terracotta:      '#EF4444',   // error
  terracottaLight: '#FEE2E2',   // error light bg

  // ── Category icon boxes ───────────────────────────────────────────────────
  iconBgAmber: '#FFF0D6',   // manpower
  iconBgTeal:  '#E0F2FE',   // machinery / info
  iconBgCoral: '#FEF3C7',   // shipping

  // ── Text ──────────────────────────────────────────────────────────────────
  textPrimary:    '#0F172A',
  textSecondary:  '#475569',
  textMuted:      '#94A3B8',
  textOnDark:     '#FFFFFF',
  textOnDarkSub:  '#64748B',
  textOnDarkMuted:'#94A3B8',

  // ── Semantic aliases (backward-compat names used across screens) ──────────
  primary:      '#101828',   // navy — primary surface color
  primaryDark:  '#101828',
  primaryLight: '#E0F2FE',
  success:      '#22C55E',
  successLight: '#DCFCE7',
  warning:      '#F59E0B',
  warningLight: '#FEF9C3',
  error:        '#EF4444',
  errorLight:   '#FEE2E2',
  background:   '#F8FAFC',   // page bg
  card:         '#FFFFFF',   // card bg
  border:       '#E2E8F0',
  muted:        '#94A3B8',
  info:         '#0369A1',
  infoLight:    '#E0F2FE',
};

export const shadows = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cta: {
    shadowColor: '#E67E3A',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.20,
    shadowRadius: 8,
    elevation: 3,
  },
  primary: {
    shadowColor: '#E67E3A',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.20,
    shadowRadius: 8,
    elevation: 3,
  },
};
