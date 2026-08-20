import { ThrottleProfile, type CachePass, type MetricId } from '@balise/schemas';
import { medianRunIndex, summariseResources } from '@balise/measure-core';
import { isAuditable } from './fingerprint.js';
import { measure } from './measure.js';
import { DEFAULT_RUNS } from './policy.js';

// developer tooling, not a product surface: strings stay inline here rather
// than in packages/i18n, which holds what a customer reads.

interface Args {
  url: string;
  profile: ThrottleProfile;
  pass: CachePass;
  runs: number;
  coverage: boolean;
}

function parseArgs(argv: readonly string[]): Args {
  const [url, ...rest] = argv;
  if (url === undefined) {
    throw new Error(
      'usage: balise-runner <url> [--profile mobile-4g] [--pass cold] [--runs 5] [--coverage]',
    );
  }
  const flags = new Map<string, string>();
  for (let i = 0; i < rest.length; i += 1) {
    const key = rest[i];
    if (key === undefined || !key.startsWith('--')) {
      throw new Error(`could not read the option starting at "${key ?? ''}"`);
    }
    const next = rest[i + 1];
    if (next === undefined || next.startsWith('--')) {
      // a flag with no value is a switch, not a missing argument.
      flags.set(key.slice(2), 'true');
      continue;
    }
    flags.set(key.slice(2), next);
    i += 1;
  }

  const profile = ThrottleProfile.parse(flags.get('profile') ?? 'mobile-4g');
  const pass = flags.get('pass') ?? 'cold';
  if (pass !== 'cold' && pass !== 'warm') {
    throw new Error(`pass must be cold or warm, received "${pass}"`);
  }
  const runs = flags.has('runs') ? Number(flags.get('runs')) : DEFAULT_RUNS;

  return { url, profile, pass, runs, coverage: flags.get('coverage') === 'true' };
}

const UNIT_SUFFIX: Record<MetricId, string> = {
  transferred_bytes: 'bytes',
  request_count: 'requests',
  dom_node_count: 'nodes',
  js_execution_ms: 'ms',
  third_party_bytes: 'bytes',
  third_party_share_pct: '%',
};

/**
 * the inventory of the run that sits on the median transferred figure. an
 * aggregate holds no capture, so this names the run it came from rather than
 * summing five pages into one that was never loaded.
 */
function printInventory(
  metricSets: Parameters<typeof medianRunIndex>[0],
  captures: readonly Parameters<typeof summariseResources>[0][],
): void {
  const index = medianRunIndex(metricSets, 'transferred_bytes');
  if (index === null) {
    console.log('\nno median run: with an even run count the median falls between two captures.');
    return;
  }
  const capture = captures[index];
  if (capture === undefined) return;

  const summary = summariseResources(capture);
  console.log(`\nresources of run ${index + 1}, the median transferred figure`);
  for (const group of summary.groups) {
    const unused =
      group.unusedDecodedBytes === 0
        ? ''
        : ` · ${(group.unusedDecodedBytes / 1000).toFixed(0)} KB decoded unused`;
    console.log(
      `  ${group.resourceType.padEnd(12)} ${String(group.requestCount).padStart(3)} req  ` +
        `${(group.transferredBytes / 1000).toFixed(1).padStart(8)} KB  ` +
        `${(group.transferredShare * 100).toFixed(1).padStart(5)}%${unused}`,
    );
  }
  if (summary.decodedUnavailableCount > 0) {
    console.log(`  ${summary.decodedUnavailableCount} resources with no decoded size`);
  }
  if (summary.coverageUnavailableCount > 0) {
    console.log(`  ${summary.coverageUnavailableCount} scripts or stylesheets with no coverage`);
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const result = await measure({
    url: args.url,
    profile: args.profile,
    pass: args.pass,
    runs: args.runs,
    coverage: args.coverage,
  });

  const fingerprint = result.fingerprint;
  console.log(`\n${args.url}  ${args.pass} pass  ${args.profile}`);
  console.log(
    `fingerprint  chromium ${fingerprint.browserBuild} · image ${fingerprint.imageDigest} · ` +
      `${fingerprint.viewportWidth}x${fingerprint.viewportHeight}@${fingerprint.deviceScaleFactor} · ` +
      `${fingerprint.locale} · ${fingerprint.timezone} · ${fingerprint.region} · ` +
      `coverage ${fingerprint.coverageEnabled ? 'on' : 'off'}`,
  );
  if (fingerprint.coverageEnabled) {
    console.log(
      'coverage instrumentation is on: script execution time is not comparable to a run without it.',
    );
  }
  if (!isAuditable(fingerprint)) {
    console.log('this run was not made in the pinned container and is not audit evidence.');
  }
  if (!result.fingerprintStable) {
    console.log('fingerprints differed between runs; confidence is low for every metric.');
  }
  for (const failure of result.failures) {
    console.log(`run ${failure.index} failed: ${failure.message}`);
  }

  if (result.status === 'insufficient-runs') {
    console.log(
      `\n${result.metricSets.length} of ${args.runs} runs succeeded. ` +
        `${result.required} are needed before there is anything to report.`,
    );
    process.exitCode = 1;
    return;
  }

  console.log(`\nmedian ± MAD over ${result.aggregate.sampleCount} runs`);
  for (const metric of result.aggregate.metrics) {
    const confidence = result.confidence[metric.metricId];
    console.log(
      `  ${metric.metricId.padEnd(22)} ${metric.median.toFixed(2)} ± ${metric.mad.toFixed(2)} ` +
        `${UNIT_SUFFIX[metric.metricId].padEnd(9)} ${confidence}`,
    );
  }

  printInventory(result.metricSets, result.captures);
  console.log('');
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
