/**
 * Typography constants for EJJAR app.
 * To enable Inter font: add Inter .ttf files to
 *   android/app/src/main/assets/fonts/
 *   ios/<ProjectName>/  (update Info.plist UIAppFonts)
 * then set FONT_FAMILY = 'Inter' below.
 */
const FONT_FAMILY = undefined; // Set to 'Inter' once font files are linked

export const font = {
  regular:  {fontFamily: FONT_FAMILY, fontWeight: '400' as const},
  medium:   {fontFamily: FONT_FAMILY, fontWeight: '500' as const},
  semiBold: {fontFamily: FONT_FAMILY, fontWeight: '600' as const},
  bold:     {fontFamily: FONT_FAMILY, fontWeight: '700' as const},
};

export const textStyles = {
  // Titles and big numbers
  h1: {fontSize: 24, ...font.bold,    color: '#1A1A2E'},
  h2: {fontSize: 20, ...font.bold,    color: '#1A1A2E'},
  h3: {fontSize: 18, ...font.semiBold, color: '#1A1A2E'},
  // Body
  body: {fontSize: 14, ...font.regular, color: '#1A1A2E', lineHeight: 22},
  bodyMedium: {fontSize: 14, ...font.medium, color: '#1A1A2E'},
  // Labels / captions
  label: {fontSize: 12, ...font.medium, color: '#6B7280'},
  caption: {fontSize: 11, ...font.regular, color: '#9CA3AF'},
  // Buttons
  button: {fontSize: 15, ...font.semiBold, color: '#FFFFFF', letterSpacing: 0.3},
};
