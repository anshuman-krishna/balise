import { z } from 'zod';
import { CachePass } from './metrics.js';

/**
 * how the browser used a response. the seven the resource inventory groups by;
 * anything the browser reports outside them (xhr, fetch, websocket, manifest)
 * is `other` rather than a category invented for it.
 */
export const ResourceType = z.enum([
  'document',
  'script',
  'stylesheet',
  'image',
  'font',
  'media',
  'other',
]);
export type ResourceType = z.infer<typeof ResourceType>;

export const CapturedResource = z
  .object({
    url: z.string().min(1),
    resourceType: ResourceType,
    /** what crossed the wire: encoded body plus response headers. */
    transferredBytes: z.number().finite().nonnegative(),
    /**
     * the body after content-encoding is undone. null when the browser could
     * not hand it back (a redirect, an evicted body), which is reported as
     * unavailable and never filled in from the transferred size: the two are
     * different quantities and a compressed bundle differs by a factor of four.
     */
    decodedBytes: z.number().finite().nonnegative().nullable(),
    /**
     * decoded bytes never executed, from the coverage capture. null where
     * coverage does not apply (anything that is not script or stylesheet) and
     * where it was not captured. it is a share of the decoded bytes and is
     * never presented as a transferred saving.
     */
    unusedDecodedBytes: z.number().finite().nonnegative().nullable(),
    /**
     * when the request started, measured from the start of the navigation, and
     * how long it took to the last byte of the response. null where the browser
     * reports no timing, which is what a cache hit and an aborted request both
     * look like. a waterfall draws these and nothing else: a bar whose position
     * was inferred from the order responses arrived in would be a drawing, not
     * a measurement.
     */
    startMs: z.number().finite().nullable(),
    durationMs: z.number().finite().nonnegative().nullable(),
  })
  .refine(
    (resource) =>
      resource.unusedDecodedBytes === null ||
      (resource.decodedBytes !== null && resource.unusedDecodedBytes <= resource.decodedBytes),
    { message: 'unusedDecodedBytes must be a share of decodedBytes' },
  );
export type CapturedResource = z.infer<typeof CapturedResource>;

// what the runner hands to extraction. the raw capture in object storage holds
// far more (full har, cdp trace); this is the slice extraction needs.
export const RawCapture = z.object({
  // origin of the audited service, e.g. "https://sevre-et-loire.fr".
  // resources on any other origin are third party.
  serviceOrigin: z.string().min(1),
  pass: CachePass,
  resources: z.array(CapturedResource),
  // requests can exceed resource entries (redirects, aborted requests).
  requestCount: z.number().int().nonnegative(),
  domNodeCountAtLoad: z.number().int().nonnegative(),
  domNodeCountAtNetworkIdle: z.number().int().nonnegative(),
  jsExecutionMs: z.number().finite().nonnegative(),
});
export type RawCapture = z.infer<typeof RawCapture>;
