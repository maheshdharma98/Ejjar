import {I18nManager} from 'react-native';

export const isRTL = (): boolean => I18nManager.isRTL;

export const rtlRow = (): 'row' | 'row-reverse' =>
  I18nManager.isRTL ? 'row-reverse' : 'row';

export const rtlTextAlign = (): 'left' | 'right' =>
  I18nManager.isRTL ? 'right' : 'left';

export const rtlSpacing = (start: number, end: number) => ({
  marginStart: start,
  marginEnd: end,
});

// For directional icons (arrows, chevrons) that should mirror in RTL
export const rtlIconFlip = (): {transform: {scaleX: number}[]} => ({
  transform: [{scaleX: I18nManager.isRTL ? -1 : 1}],
});
