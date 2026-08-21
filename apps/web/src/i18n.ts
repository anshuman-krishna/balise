import { catalogs, type Locale } from '@balise/i18n';

// current design canon: english app chrome, french domain terms verbatim,
// documents entirely french. flip this one line to change the app locale.
export const locale: Locale = 'en';

export const t = catalogs[locale];

/**
 * the french catalog, for the surfaces that are french whatever the app locale
 * is: the public scan, the observatory, the verification permalink and every
 * generated document. a buyer reading a declaration is not reading the app.
 */
export const tFr = catalogs.fr;

/**
 * the language of the content under each register, as a `lang` attribute. the
 * instrument is the app locale and inherits it; a document and a public surface
 * are french regardless, and a screen reader has to be told which voice to use.
 */
export const CONTENT_LOCALE: Record<'instrument' | 'document' | 'public', Locale | undefined> = {
  instrument: undefined,
  document: 'fr',
  public: 'fr',
};

export { fill, fillParts } from '@balise/i18n';
