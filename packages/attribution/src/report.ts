import type { AttributionReport, ModuleDiff, Reconciliation } from '@balise/schemas';
import { attributeBundle, utf8Length, type BundleInput } from './bundle.js';
import { diffModules } from './modules.js';
import { diffOrigins, diffResources, type ResourceSideInput } from './resources.js';

export interface AttributionSide extends ResourceSideInput {
  /** the bundles submitted for explanation, with their maps where they exist. */
  bundles?: readonly BundleInput[];
}

function requestKey(url: string): string {
  const hash = url.indexOf('#');
  return hash < 0 ? url : url.slice(0, hash);
}

/**
 * the decoded size of a submitted bundle on one side, or null when we cannot
 * say. the resource record's measured size is preferred; the served text is
 * the same quantity counted a second way and is used when the record has none.
 */
function decodedSizeOf(side: AttributionSide, bundle: BundleInput): number | null {
  const key = requestKey(bundle.url);
  for (const resource of side.resources) {
    if (requestKey(resource.url) === key && resource.decodedBytes !== undefined) {
      return resource.decodedBytes;
    }
  }
  return bundle.content === undefined || bundle.content === null ? null : utf8Length(bundle.content);
}

function submittedDecodedBytes(side: AttributionSide): number | null {
  let total = 0;
  for (const bundle of side.bundles ?? []) {
    const size = decodedSizeOf(side, bundle);
    if (size === null) return null;
    total += size;
  }
  return total;
}

/**
 * how much of the measured change the modules account for.
 *
 * source maps explain decoded bytes, so this reconciles against the decoded
 * size of the submitted bundles and never against transferred bytes, which
 * are compressed and are a different quantity. whatever is left over is
 * reported as unexplained rather than folded into the largest module.
 */
export function reconcile(before: AttributionSide, after: AttributionSide, modules: ModuleDiff): Reconciliation {
  const beforeBytes = submittedDecodedBytes(before);
  const afterBytes = submittedDecodedBytes(after);
  const measuredDelta = beforeBytes === null || afterBytes === null ? null : afterBytes - beforeBytes;
  // an incomplete module diff explains nothing, so it claims nothing. the whole
  // measured delta stays unexplained rather than being partly accounted for by
  // a comparison that is missing one side.
  const explainedDelta = modules.complete ? modules.after.attributedBytes - modules.before.attributedBytes : 0;
  return {
    measuredDelta,
    explainedDelta,
    unexplainedDelta: measuredDelta === null ? null : measuredDelta - explainedDelta,
    complete: modules.complete && measuredDelta !== null,
  };
}

/**
 * explain what changed between two runs. pure: every input is passed in, and
 * nothing here fetches a source map or reads a repository.
 *
 * the report is advisory. it explains a budget breach, it never causes one.
 */
export function attribute(before: AttributionSide, after: AttributionSide): AttributionReport {
  const beforeBundles = (before.bundles ?? []).map(attributeBundle);
  const afterBundles = (after.bundles ?? []).map(attributeBundle);
  const modules = diffModules(beforeBundles, afterBundles);

  return {
    resources: diffResources(before, after),
    origins: diffOrigins(before, after),
    bundles: { before: beforeBundles, after: afterBundles },
    modules,
    reconciliation: reconcile(before, after, modules),
  };
}
