// EJJAR Design System v1.0 — typography tokens
// Inter font (linked once font files are added to native projects)
const FONT_FAMILY = undefined; // Set to 'Inter' once font files are linked

export const font = {
  regular:  {fontFamily: FONT_FAMILY, fontWeight: '400' as const},
  medium:   {fontFamily: FONT_FAMILY, fontWeight: '500' as const},
  semiBold: {fontFamily: FONT_FAMILY, fontWeight: '600' as const},
  bold:     {fontFamily: FONT_FAMILY, fontWeight: '700' as const},
};

export const textStyles = {
  // Screen title — white on dark header
  screenTitle: {fontSize: 18, ...font.bold,    color: '#FFFFFF'},
  // Section / page headings
  h2:          {fontSize: 16, ...font.semiBold, color: '#0F172A'},
  h3:          {fontSize: 14, ...font.semiBold, color: '#0F172A'},
  // Body
  body:        {fontSize: 14, ...font.regular,  color: '#475569', lineHeight: 20},
  bodyMedium:  {fontSize: 13, ...font.medium,   color: '#475569'},
  // Secondary / muted
  secondary:   {fontSize: 12, ...font.regular,  color: '#475569'},
  muted:       {fontSize: 11, ...font.regular,  color: '#94A3B8'},
  // Field labels — UPPERCASE, letter-spaced
  fieldLabel:  {fontSize: 11, ...font.semiBold, color: '#94A3B8', textTransform: 'uppercase' as const, letterSpacing: 0.7},
  // Card text
  cardTitle:   {fontSize: 13, ...font.semiBold, color: '#0F172A'},
  cardDesc:    {fontSize: 12, ...font.regular,  color: '#475569', lineHeight: 16},
  // Buttons
  button:      {fontSize: 14, ...font.bold,     color: '#FFFFFF'},
  // Badge
  badge:       {fontSize: 10, ...font.semiBold},
  // Caption / meta
  caption:     {fontSize: 11, ...font.regular,  color: '#94A3B8'},
  // Tab labels
  tabActive:   {fontSize: 12, ...font.semiBold, color: '#0F172A'},
  tabDefault:  {fontSize: 12, ...font.regular,  color: '#64748B'},
  // Stats
  statNumber:  {fontSize: 24, ...font.bold,     color: '#0F172A'},
  price:       {fontSize: 18, ...font.bold,     color: '#0F172A'},
};
