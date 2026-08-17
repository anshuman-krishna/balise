import { catalogs, type Locale } from '@balise/i18n';

// Current design canon: English app chrome, French domain terms verbatim,
// documents entirely French. Flip this one line to change the app locale.
export const locale: Locale = 'en';

export const t = catalogs[locale];

export { fill } from '@balise/i18n';
