import { ThrottleProfile, type CachePass, type MetricId } from '@balise/schemas';
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
}

function parseArgs(argv: readonly string[]): Args {
  const [url, ...rest] = argv;
  if (url === undefined) {
    throw new Error('usage: balise-runner <url> [--profile mobile-4g] [--pass cold] [--runs 5]');
  }
  const flags = new Map<string, string>();
  for (let i = 0; i < rest.length; i += 2) {
    const key = rest[i];
    const value = rest[i + 1];
    if (key === undefined || value === undefined || !key.startsWith('--')) {
      throw new Error(`could not read the option starting at "${key ?? ''}"`);
    }
    flags.set(key.slice(2), value);
  }

  const profile = ThrottleProfile.parse(flags.get('profile') ?? 'mobile-4g');
  const pass = flags.get('pass') ?? 'cold';
  if (pass !== 'cold' && pass !== 'warm') {
    throw new Error(`pass must be cold or warm, received "${pass}"`);
  }
  const runs = flags.has('runs') ? Number(flags.get('runs')) : DEFAULT_RUNS;

  return { url, profile, pass, runs };
}

const UNIT_SUFFIX: Record<MetricId, string> = {
  transferred_bytes: 'bytes',
  request_count: 'requests',
  dom_node_count: 'nodes',
  js_execution_ms: 'ms',
  third_party_bytes: 'bytes',
  third_party_share_pct: '%',
};

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const result = await measure({
    url: args.url,
    profile: args.profile,
    pass: args.pass,
    runs: args.runs,
  });

  const fingerprint = result.fingerprint;
  console.log(`\n${args.url}  ${args.pass} pass  ${args.profile}`);
  console.log(
    `fingerprint  chromium ${fingerprint.browserBuild} · image ${fingerprint.imageDigest} · ` +
      `${fingerprint.viewportWidth}x${fingerprint.viewportHeight}@${fingerprint.deviceScaleFactor} · ` +
      `${fingerprint.locale} · ${fingerprint.timezone} · ${fingerprint.region}`,
  );
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
  console.log('');
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
