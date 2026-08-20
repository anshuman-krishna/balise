import type { ResourceType } from '@balise/schemas';

/**
 * chromium reports more request types than the inventory groups by. the six
 * named ones map across; everything else (xhr, fetch, eventsource, websocket,
 * manifest, texttrack, ping) is `other`, which is what it is rather than a
 * category invented to make the table look complete.
 */
const MAPPING: Readonly<Record<string, ResourceType>> = {
  document: 'document',
  script: 'script',
  stylesheet: 'stylesheet',
  image: 'image',
  font: 'font',
  media: 'media',
};

export function resourceTypeOf(reported: string): ResourceType {
  return MAPPING[reported] ?? 'other';
}
