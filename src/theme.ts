// ─────────────────────────────────────────────────────────────────────────────
// EJJAR Design System — single source of truth
// Import from here. Never hardcode hex values in components.
// ─────────────────────────────────────────────────────────────────────────────

export const colors = {
  // ── Core brand ────────────────────────────────────────────────────────────
  navy:             '#101828',   // header, sidebar, dark surfaces
  orange:           '#E67E3A',   // CTA, active state — max 3 uses per screen
  teal:             '#0369A1',   // info blue — secondary actions
  gold:             '#C9974A',   // form icons only

  // ── Page & surface ────────────────────────────────────────────────────────
  pageBg:           '#F8FAFC',
  cardBg:           '#FFFFFF',
  inputBg:          '#F8FAFC',
  headerBg:         '#101828',

  // ── Borders ───────────────────────────────────────────────────────────────
  cardBorder:       '#E2E8F0',
  inputBorder:      '#E2E8F0',
  inputActive:      '#E67E3A',
  divider:          '#F1F5F9',

  // ── Text ──────────────────────────────────────────────────────────────────
  textPrimary:      '#0F172A',
  textSecondary:    '#475569',
  textMuted:        '#94A3B8',
  textOnDark:       '#FFFFFF',
  textOnDarkMuted:  '#64748B',
  textLabel:        '#94A3B8',

  // ── Semantic ──────────────────────────────────────────────────────────────
  successBg:        '#DCFCE7',
  successText:      '#166534',
  warningBg:        '#FEF9C3',
  warningText:      '#854D0E',
  errorBg:          '#FEE2E2',
  errorText:        '#991B1B',
  infoBg:           '#E0F2FE',
  infoText:         '#0369A1',

  // ── Category icon boxes ───────────────────────────────────────────────────
  // Fixed pairs — use identically on every screen, every card type
  iconManpowerBg:      '#FFF0D6',
  iconManpowerColor:   '#C9974A',
  iconMachineryBg:     '#E0F2FE',
  iconMachineryColor:  '#0369A1',
  iconShippingBg:      '#FEF3C7',
  iconShippingColor:   '#D97706',
  iconElectricalBg:    '#DCFCE7',
  iconElectricalColor: '#166534',
  iconCivilBg:         '#F3E8FF',
  iconCivilColor:      '#7C3AED',
  iconGeneralBg:       '#F1F5F9',
  iconGeneralColor:    '#475569',
} as const;

// ─────────────────────────────────────────────────────────────────────────────

export const spacing = {
  screenX:      16,   // horizontal screen padding
  cardPadH:     16,   // card horizontal padding
  cardPadV:     14,   // card vertical padding
  cardGap:       8,   // gap between cards
  sectionGap:   16,   // gap between sections
  fieldGap:     12,   // gap between form fields
  iconInner:    10,   // icon box inner padding
  inlineGap:     8,   // inline element gap
  navHeight:    60,   // bottom nav height (+ safe area)
  contentPadB:  80,   // ScrollView paddingBottom (always)
} as const;

// ─────────────────────────────────────────────────────────────────────────────

export const radius = {
  card:    16,   // screen-level cards
  inner:   12,   // inner/nested cards
  button:  10,   // buttons
  input:   10,   // inputs, selects
  icon:    12,   // icon boxes
  badge:   999,  // badges, pills
  chip:    999,  // sort chips
  stat:    10,   // stats cards
  nav:      0,   // bottom nav (full width)
} as const;

// ─────────────────────────────────────────────────────────────────────────────

export const shadow = {
  card: {
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cta: {
    shadowColor: '#E67E3A',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Category icon box helper — returns {bg, iconColor, iconName} for a category
// Use on: home cards, RFQ cards, job cards, supplier cards, any screen
// ─────────────────────────────────────────────────────────────────────────────

export type CategoryKey = 'manpower' | 'machinery' | 'shipping' | 'electrical' | 'civil' | 'general';

export const categoryMeta: Record<CategoryKey, {bg: string; iconColor: string; iconName: string}> = {
  manpower:   {bg: colors.iconManpowerBg,   iconColor: colors.iconManpowerColor,   iconName: 'hard-hat'},
  machinery:  {bg: colors.iconMachineryBg,  iconColor: colors.iconMachineryColor,  iconName: 'crane'},
  shipping:   {bg: colors.iconShippingBg,   iconColor: colors.iconShippingColor,   iconName: 'package'},
  electrical: {bg: colors.iconElectricalBg, iconColor: colors.iconElectricalColor, iconName: 'zap'},
  civil:      {bg: colors.iconCivilBg,      iconColor: colors.iconCivilColor,      iconName: 'building'},
  general:    {bg: colors.iconGeneralBg,    iconColor: colors.iconGeneralColor,    iconName: 'briefcase'},
};

// ─────────────────────────────────────────────────────────────────────────────
// Status badge helper — returns {bg, textColor} for a status string
// Use on: RFQ cards, Job cards, Supplier cards — identical everywhere
// ─────────────────────────────────────────────────────────────────────────────

export type StatusKey =
  | 'accepted' | 'completed' | 'done'
  | 'active' | 'quotes_in' | 'in_progress' | 'new' | 'supplier_responded' | 'negotiation'
  | 'broadcasted' | 'sent' | 'confirmed'
  | 'pending' | 'pending_start' | 'paused'
  | 'rejected' | 'cancelled'
  | 'available'
  | 'unavailable' | 'busy';

export function statusBadge(status: string): {bg: string; textColor: string; label: string} {
  const s = status?.toLowerCase() ?? '';

  if (['accepted', 'completed', 'done', 'available'].includes(s)) {
    return {bg: colors.successBg, textColor: colors.successText, label: capitalise(s)};
  }
  if (['active', 'quotes_in', 'in_progress', 'new', 'supplier_responded', 'negotiation'].includes(s)) {
    return {bg: colors.warningBg, textColor: colors.warningText, label: labelFor(s)};
  }
  if (['broadcasted', 'sent', 'confirmed'].includes(s)) {
    return {bg: colors.infoBg, textColor: colors.infoText, label: capitalise(s)};
  }
  if (['pending', 'pending_start', 'paused'].includes(s)) {
    return {bg: colors.divider, textColor: colors.textSecondary, label: capitalise(s)};
  }
  if (['rejected', 'cancelled', 'unavailable', 'busy'].includes(s)) {
    return {bg: colors.errorBg, textColor: colors.errorText, label: capitalise(s)};
  }
  return {bg: colors.divider, textColor: colors.textSecondary, label: capitalise(s)};
}

function capitalise(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function labelFor(s: string): string {
  const map: Record<string, string> = {
    quotes_in:          'Quotes In',
    in_progress:        'In Progress',
    supplier_responded: 'Quotes In',
    new:                'Active',
    negotiation:        'Negotiating',
  };
  return map[s] ?? capitalise(s);
}
