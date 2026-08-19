import {
  BUDGET_METRIC_ID,
  BudgetMetricKey,
  METRIC_UNIT,
  RELATIVE_KEY,
  ThrottleProfile,
  type BudgetConfig,
  type BudgetRule,
  type BudgetScope,
  type ConfigIssue,
  type ConfigResult,
  type MetricId,
  type Threshold,
  type Unit,
} from '@balise/schemas';
import { parseYaml, type YamlValue } from './yaml.js';

/**
 * reads balise.yml into a config the engine can evaluate, or refuses it with
 * every problem it found rather than the first one, so a file is fixed in one
 * pass. an unknown key is an error and not a shrug: a typo in a budget key
 * would otherwise silently switch a limit off.
 */

const ROOT_KEYS = new Set([
  'version',
  'service',
  'runs',
  'profiles',
  'reference_model',
  'noise_floor',
  'budgets',
  'check',
]);

const CHECK_KEYS = new Set(['block_merge_on', 'annotate_files']);
const THRESHOLD_KEYS = new Set(['warn', 'fail', 'metric']);
const BLOCK_MERGE_ON = new Set(['fail', 'warn', 'never']);

/** the smallest run count the methodology allows. configurable up, never down. */
export const MINIMUM_RUNS = 3;

const BYTE_UNITS: Record<string, number> = {
  b: 1,
  kb: 1_000,
  mb: 1_000_000,
  gb: 1_000_000_000,
  kib: 1_024,
  mib: 1_048_576,
  gib: 1_073_741_824,
};

/** `900KB` in bytes. decimal by default, because a kilobyte on the wire is a thousand bytes. */
export function parseByteSize(text: string): number | null {
  const match = /^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb|kib|mib|gib)$/i.exec(text.trim());
  if (match === null) return null;
  const factor = BYTE_UNITS[match[2]!.toLowerCase()]!;
  return Number(match[1]) * factor;
}

export function parsePercent(text: string): number | null {
  const match = /^([+-]?\d+(?:\.\d+)?)\s*%$/.exec(text.trim());
  return match === null ? null : Number(match[1]);
}

export function parseCount(text: string): number | null {
  const match = /^(\d+)$/.exec(text.trim());
  return match === null ? null : Number(match[1]);
}

// ---------------------------------------------------------------------------

interface Reader {
  issues: ConfigIssue[];
  lines: ReadonlyMap<string, number>;
}

function lineOf(reader: Reader, path: string): number {
  return reader.lines.get(path) ?? 0;
}

function refuse(reader: Reader, path: string, message: string): void {
  reader.issues.push({ line: lineOf(reader, path), path, message });
}

function isMapping(value: YamlValue): value is Record<string, YamlValue> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function unknownKeys(reader: Reader, value: Record<string, YamlValue>, allowed: Set<string>, path: string): void {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      const keyPath = path.length === 0 ? key : `${path}.${key}`;
      refuse(reader, keyPath, `\`${key}\` is not a key balise.yml accepts`);
    }
  }
}

function readScope(reader: Reader, raw: YamlValue, path: string): BudgetScope | null {
  if (typeof raw !== 'string' || raw.trim().length === 0) {
    refuse(reader, path, 'a budget needs a `scope`');
    return null;
  }
  const text = raw.trim();
  if (text === 'service') return { kind: 'service' };
  if (text.startsWith('journey:')) {
    const journey = text.slice('journey:'.length).trim();
    if (journey.length === 0) {
      refuse(reader, path, 'a journey scope needs an id, as `journey:<id>`');
      return null;
    }
    return { kind: 'journey', journey };
  }
  if (text.startsWith('/')) return { kind: 'route', pattern: text };
  refuse(reader, path, 'a scope is `service`, `journey:<id>`, or a route beginning with `/`');
  return null;
}

function readThreshold(
  reader: Reader,
  raw: YamlValue,
  unit: Unit,
  path: string,
): Threshold | null {
  const text = typeof raw === 'number' ? String(raw) : raw;
  if (typeof text !== 'string') {
    refuse(reader, path, 'a threshold is a number with its unit, such as `900KB`');
    return null;
  }

  const value =
    unit === 'bytes' ? parseByteSize(text) : unit === 'pct' ? parsePercent(text) : parseCount(text);
  if (value === null) {
    const example = unit === 'bytes' ? '`900KB`' : unit === 'pct' ? '`30%`' : 'a whole number';
    refuse(reader, path, `\`${text}\` is not a threshold in ${unit}, expected ${example}`);
    return null;
  }
  return { value, sourceText: text, line: lineOf(reader, path) };
}

interface Bounds {
  warn: Threshold | null;
  fail: Threshold | null;
  metric: BudgetMetricKey | null;
}

/**
 * a threshold block is `{ warn: x, fail: y }`, or a bare value, which is the
 * failing one. the shorthand exists because a budget with no failure threshold
 * is a note, not a budget.
 */
function readBounds(reader: Reader, raw: YamlValue, unit: Unit, path: string): Bounds {
  if (!isMapping(raw)) {
    return { warn: null, fail: readThreshold(reader, raw, unit, path), metric: null };
  }

  unknownKeys(reader, raw, THRESHOLD_KEYS, path);
  const warn = raw.warn === undefined ? null : readThreshold(reader, raw.warn, unit, `${path}.warn`);
  const fail = raw.fail === undefined ? null : readThreshold(reader, raw.fail, unit, `${path}.fail`);

  let metric: BudgetMetricKey | null = null;
  if (raw.metric !== undefined) {
    const parsed = BudgetMetricKey.safeParse(raw.metric);
    if (parsed.success) metric = parsed.data;
    else refuse(reader, `${path}.metric`, `\`${String(raw.metric)}\` is not a metric a budget can limit`);
  }

  if (warn === null && fail === null) {
    refuse(reader, path, 'a budget needs at least one of `warn` and `fail`');
  }
  // every metric here regresses when it grows, so warning after failing would
  // mean the warning could never be reached.
  if (warn !== null && fail !== null && warn.value >= fail.value) {
    refuse(reader, `${path}.warn`, '`warn` must be below `fail`');
  }

  return { warn, fail, metric };
}

function readRules(reader: Reader, raw: YamlValue, path: string): BudgetRule[] {
  if (!Array.isArray(raw)) {
    refuse(reader, path, '`budgets` is a list of scopes and their limits');
    return [];
  }

  const rules: BudgetRule[] = [];
  raw.forEach((entry, index) => {
    const entryPath = `${path}.${index}`;
    if (!isMapping(entry)) {
      refuse(reader, entryPath, 'a budget is a mapping with a `scope`');
      return;
    }

    const allowed = new Set<string>(['scope', RELATIVE_KEY, ...BudgetMetricKey.options]);
    unknownKeys(reader, entry, allowed, entryPath);

    const scope = readScope(reader, entry.scope ?? null, `${entryPath}.scope`);
    if (scope === null) return;

    for (const key of BudgetMetricKey.options) {
      const value = entry[key];
      if (value === undefined) continue;
      const metricId: MetricId = BUDGET_METRIC_ID[key];
      const unit = METRIC_UNIT[metricId];
      const bounds = readBounds(reader, value, unit, `${entryPath}.${key}`);
      if (bounds.metric !== null) {
        refuse(reader, `${entryPath}.${key}.metric`, '`metric` belongs to `relative_to_baseline`');
      }
      rules.push({
        kind: 'absolute',
        scope,
        metricId,
        unit,
        warn: bounds.warn,
        fail: bounds.fail,
        line: lineOf(reader, `${entryPath}.${key}`),
      });
    }

    const relative = entry[RELATIVE_KEY];
    if (relative !== undefined) {
      const relPath = `${entryPath}.${RELATIVE_KEY}`;
      const bounds = readBounds(reader, relative, 'pct', relPath);
      // a growth limit at or below zero would fail on every run that is not an
      // improvement, which is not a budget, it is a ratchet.
      for (const [name, bound] of [['warn', bounds.warn], ['fail', bounds.fail]] as const) {
        if (bound !== null && bound.value <= 0) {
          refuse(reader, `${relPath}.${name}`, `\`${name}\` on ${RELATIVE_KEY} is a growth allowance and must be above 0%`);
        }
      }
      const metricId = BUDGET_METRIC_ID[bounds.metric ?? 'bytes'];
      rules.push({
        kind: 'relative',
        scope,
        metricId,
        unit: 'pct',
        warn: bounds.warn,
        fail: bounds.fail,
        line: lineOf(reader, relPath),
      });
    }
  });

  return rules;
}

export function readConfig(source: string): ConfigResult {
  const parsed = parseYaml(source);
  if (parsed.status === 'invalid') return { status: 'invalid', issues: parsed.issues.map(toIssue) };

  const reader: Reader = { issues: [], lines: parsed.lines };
  const root = parsed.value;
  if (!isMapping(root)) {
    return {
      status: 'invalid',
      issues: [{ line: 1, path: '', message: 'balise.yml is a mapping of settings' }],
    };
  }

  unknownKeys(reader, root, ROOT_KEYS, '');

  if (root.version !== 1) {
    refuse(reader, 'version', '`version` must be 1');
  }

  const service = typeof root.service === 'string' && root.service.trim().length > 0 ? root.service.trim() : null;
  if (service === null) refuse(reader, 'service', '`service` names the audited service');

  let runs = 5;
  if (root.runs !== undefined) {
    if (typeof root.runs !== 'number' || !Number.isInteger(root.runs)) {
      refuse(reader, 'runs', '`runs` is a whole number of runs per scenario');
    } else if (root.runs < MINIMUM_RUNS) {
      refuse(reader, 'runs', `\`runs\` may not go below ${MINIMUM_RUNS}: a median needs runs to sit on`);
    } else {
      runs = root.runs;
    }
  }

  const profiles: ThrottleProfile[] = [];
  if (!Array.isArray(root.profiles) || root.profiles.length === 0) {
    refuse(reader, 'profiles', '`profiles` lists at least one named throttle profile');
  } else {
    for (const entry of root.profiles) {
      const profile = ThrottleProfile.safeParse(entry);
      if (profile.success) profiles.push(profile.data);
      else {
        refuse(
          reader,
          'profiles',
          `\`${String(entry)}\` is not a named profile (${ThrottleProfile.options.join(', ')})`,
        );
      }
    }
  }

  const referenceModel =
    typeof root.reference_model === 'string' && root.reference_model.trim().length > 0
      ? root.reference_model.trim()
      : null;
  if (referenceModel === null) {
    refuse(reader, 'reference_model', '`reference_model` names the model marked on every band, as `id@version`');
  }

  if (root.noise_floor !== undefined && root.noise_floor !== 'auto') {
    refuse(
      reader,
      'noise_floor',
      '`noise_floor` accepts only `auto`: the floor is derived from measured dispersion, never written down',
    );
  }

  const rules = root.budgets === undefined ? [] : readRules(reader, root.budgets, 'budgets');
  if (rules.length === 0 && root.budgets === undefined) {
    refuse(reader, '', 'balise.yml carries no `budgets`');
  }

  let blockMergeOn: BudgetConfig['check']['blockMergeOn'] = 'fail';
  let annotateFiles = false;
  if (root.check !== undefined) {
    if (!isMapping(root.check)) {
      refuse(reader, 'check', '`check` is a mapping');
    } else {
      unknownKeys(reader, root.check, CHECK_KEYS, 'check');
      const on = root.check.block_merge_on;
      if (on !== undefined) {
        if (typeof on === 'string' && BLOCK_MERGE_ON.has(on)) {
          blockMergeOn = on as BudgetConfig['check']['blockMergeOn'];
        } else {
          refuse(reader, 'check.block_merge_on', '`block_merge_on` is `fail`, `warn` or `never`');
        }
      }
      const annotate = root.check.annotate_files;
      if (annotate !== undefined) {
        if (typeof annotate === 'boolean') annotateFiles = annotate;
        else refuse(reader, 'check.annotate_files', '`annotate_files` is true or false');
      }
    }
  }

  // the two null checks are already refusals; naming them here is what lets the
  // config below be built without a cast.
  if (reader.issues.length > 0 || service === null || referenceModel === null) {
    return { status: 'invalid', issues: reader.issues.sort((a, b) => a.line - b.line) };
  }

  return {
    status: 'ok',
    config: {
      version: 1,
      service,
      runs,
      profiles,
      referenceModel,
      noiseFloor: 'auto',
      rules,
      check: { blockMergeOn, annotateFiles },
    },
  };
}

function toIssue(issue: { line: number; path: string; message: string }): ConfigIssue {
  return { line: issue.line, path: issue.path, message: issue.message };
}
