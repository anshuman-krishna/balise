import type { VendorMatch } from '@balise/schemas';

interface VendorEntry extends VendorMatch {
  /** registrable domains this vendor serves from. matched exactly or as a suffix. */
  domains: readonly string[];
}

/**
 * tag vendors we can name. this list is maintained by hand and is deliberately
 * short: an origin that matches nothing here is reported by its hostname, with
 * its measured cost, and is never guessed at. see the honest-degradation rule.
 *
 * labels are proper nouns and are not translated.
 */
export const VENDORS: readonly VendorEntry[] = [
  { id: 'matomo', label: 'Matomo', category: 'analytics', domains: ['matomo.cloud', 'matomo.org'] },
  { id: 'google-analytics', label: 'Google Analytics', category: 'analytics', domains: ['google-analytics.com', 'analytics.google.com'] },
  { id: 'google-tag-manager', label: 'Google Tag Manager', category: 'analytics', domains: ['googletagmanager.com'] },
  { id: 'hotjar', label: 'Hotjar', category: 'analytics', domains: ['hotjar.com', 'hotjar.io'] },
  { id: 'at-internet', label: 'AT Internet', category: 'analytics', domains: ['ati-host.net', 'xiti.com'] },
  { id: 'eulerian', label: 'Eulerian', category: 'analytics', domains: ['eulerian.net'] },

  { id: 'tarteaucitron', label: 'Tarteaucitron', category: 'consent', domains: ['tarteaucitron.io'] },
  { id: 'axeptio', label: 'Axeptio', category: 'consent', domains: ['axept.io', 'axeptio.eu'] },
  { id: 'didomi', label: 'Didomi', category: 'consent', domains: ['didomi.io'] },
  { id: 'orejime', label: 'Orejime', category: 'consent', domains: ['orejime.io'] },

  { id: 'youtube', label: 'YouTube', category: 'media', domains: ['youtube.com', 'youtube-nocookie.com', 'ytimg.com'] },
  { id: 'dailymotion', label: 'Dailymotion', category: 'media', domains: ['dailymotion.com', 'dmcdn.net'] },
  { id: 'vimeo', label: 'Vimeo', category: 'media', domains: ['vimeo.com', 'vimeocdn.com'] },

  { id: 'doubleclick', label: 'Google Ads', category: 'advertising', domains: ['doubleclick.net', 'googlesyndication.com', 'googleadservices.com'] },
  { id: 'meta', label: 'Meta', category: 'advertising', domains: ['facebook.net', 'facebook.com'] },
  { id: 'linkedin-ads', label: 'LinkedIn Ads', category: 'advertising', domains: ['licdn.com', 'linkedin.com'] },

  { id: 'crisp', label: 'Crisp', category: 'support', domains: ['crisp.chat'] },
  { id: 'intercom', label: 'Intercom', category: 'support', domains: ['intercom.io', 'intercomcdn.com'] },
  { id: 'zendesk', label: 'Zendesk', category: 'support', domains: ['zdassets.com', 'zendesk.com'] },

  { id: 'jsdelivr', label: 'jsDelivr', category: 'cdn', domains: ['jsdelivr.net'] },
  { id: 'unpkg', label: 'unpkg', category: 'cdn', domains: ['unpkg.com'] },
  { id: 'cdnjs', label: 'cdnjs', category: 'cdn', domains: ['cdnjs.cloudflare.com'] },

  { id: 'stripe', label: 'Stripe', category: 'payment', domains: ['stripe.com', 'stripe.network'] },
  { id: 'paybox', label: 'Paybox', category: 'payment', domains: ['paybox.com'] },
  { id: 'payfip', label: 'PayFiP', category: 'payment', domains: ['payfip.gouv.fr'] },

  { id: 'sentry', label: 'Sentry', category: 'monitoring', domains: ['sentry.io'] },
  { id: 'datadog', label: 'Datadog', category: 'monitoring', domains: ['datadoghq.com', 'datadoghq.eu'] },

  { id: 'google-fonts', label: 'Google Fonts', category: 'font', domains: ['fonts.googleapis.com', 'fonts.gstatic.com'] },
  { id: 'adobe-fonts', label: 'Adobe Fonts', category: 'font', domains: ['typekit.net', 'use.typekit.com'] },

  { id: 'api-gouv', label: 'api.gouv.fr', category: 'public-api', domains: ['api.gouv.fr'] },
  { id: 'ign', label: 'IGN Géoplateforme', category: 'public-api', domains: ['geopf.fr', 'ign.fr'] },
  { id: 'openstreetmap', label: 'OpenStreetMap', category: 'public-api', domains: ['openstreetmap.org', 'tile.openstreetmap.fr'] },
];

/**
 * name the vendor behind a hostname, or return null. matching is exact or on a
 * dot-boundary suffix. there is no fuzzy matching: a near miss would put a
 * vendor's name on traffic that is not theirs.
 */
export function identifyVendor(hostname: string): VendorMatch | null {
  const host = hostname.toLowerCase();
  for (const vendor of VENDORS) {
    for (const domain of vendor.domains) {
      if (host === domain || host.endsWith(`.${domain}`)) {
        return { id: vendor.id, label: vendor.label, category: vendor.category };
      }
    }
  }
  return null;
}
