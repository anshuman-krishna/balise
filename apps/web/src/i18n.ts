import { catalogs, type Locale } from '@balise/i18n';

// current design canon: english app chrome, french domain terms verbatim,
// documents entirely french. flip this one line to change the app locale.
export const locale: Locale = 'en';

export const t = catalogs[locale];

export { fill } from '@balise/i18n';
