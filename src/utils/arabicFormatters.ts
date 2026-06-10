import i18n from '../i18n';

const ARABIC_NUMERALS: Record<string, string> = {
  '0': '٠', '1': '١', '2': '٢', '3': '٣', '4': '٤',
  '5': '٥', '6': '٦', '7': '٧', '8': '٨', '9': '٩',
};

const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

const ENGLISH_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function toArabicNumerals(input: string | number): string {
  return String(input)
    .split('')
    .map(c => ARABIC_NUMERALS[c] ?? c)
    .join('');
}

export function formatCurrency(amount: number, useArabicNumerals = false): string {
  const lang = i18n.language;
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  if (lang === 'ar') {
    const num = useArabicNumerals ? toArabicNumerals(formatted) : formatted;
    return `${num} ر.ع.`;
  }
  return `OMR ${formatted}`;
}

export function formatDate(dateString: string): string {
  const lang = i18n.language;
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();
  if (lang === 'ar') {
    return `${day} ${ARABIC_MONTHS[month]} ${year}`;
  }
  return `${day} ${ENGLISH_MONTHS[month]} ${year}`;
}

export function formatRelativeTime(dateString: string): string {
  const lang = i18n.language;
  const now = Date.now();
  const time = new Date(dateString).getTime();
  const diffMin = Math.floor((now - time) / 60000);

  if (lang === 'ar') {
    if (diffMin < 1) return 'الآن';
    if (diffMin < 60) return `قبل ${diffMin} دقيقة`;
    if (diffMin < 1440) return `قبل ${Math.floor(diffMin / 60)} ساعة`;
    return `قبل ${Math.floor(diffMin / 1440)} يوم`;
  }

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`;
  return `${Math.floor(diffMin / 1440)}d ago`;
}

export function getLocalizedField<T extends Record<string, any>>(
  obj: T,
  fieldName: string,
): string {
  const lang = i18n.language;
  if (lang === 'ar') {
    const arField = `${fieldName}Ar`;
    if (arField in obj && obj[arField]) {
      return obj[arField];
    }
  }
  return obj[fieldName] ?? '';
}
