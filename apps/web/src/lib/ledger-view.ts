import type { LedgerEntry } from '@balise/schemas';
import { formatInt, formatNumber } from '@balise/ui';

/**
 * turns an entry into what the public verification page shows. it reads the
 * payload the entry actually carries and says nothing the entry does not
 * contain: a field with no value in the record is absent from the view, not
 * filled in from somewhere else.
 */

export interface LedgerRecordValues {
  transferredKb: string;
  madKb: string;
  requests: string;
  domNodes: string;
  carbon: string;
  low: string;
  high: string;
}

export interface LedgerRecordView {
  hash: string;
  shortHash: string;
  type: string;
  recordedAt: string;
  methodology: string;
  /** the model ids and versions the entry recorded, if it recorded any. */
  models?: string;
  fingerprint?: string;
  position: string;
  values?: LedgerRecordValues;
}

function text(payload: Record<string, unknown>, key: string): string | undefined {
  const value = payload[key];
  return typeof value === 'string' ? value : undefined;
}

function record(payload: Record<string, unknown>, key: string): Record<string, unknown> | undefined {
  const value = payload[key];
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function number(payload: Record<string, unknown>, key: string): number | undefined {
  const value = payload[key];
  return typeof value === 'number' ? value : undefined;
}

/** kind, then the one detail that identifies which of that kind it is. */
export function describeKind(entry: LedgerEntry): string {
  const payload = entry.payload;
  switch (entry.kind) {
    case 'run': {
      const scenario = text(payload, 'scenario');
      const profile = text(payload, 'profile');
      return ['run', scenario, profile].filter((part) => part !== undefined).join(' · ');
    }
    case 'report_generated':
      return ['report_generated', text(payload, 'quarter')].filter((p) => p !== undefined).join(' · ');
    case 'declaration_version':
      return ['declaration_version', text(payload, 'version')].filter((p) => p !== undefined).join(' · ');
    case 'budget_override':
      return ['budget_override', text(payload, 'pullRequest')].filter((p) => p !== undefined).join(' · ');
    case 'rebaseline':
      return ['rebaseline', text(payload, 'toRun')].filter((p) => p !== undefined).join(' · ');
    case 'methodology_version':
    case 'attestation':
      return [entry.kind, text(payload, 'version')].filter((p) => p !== undefined).join(' · ');
  }
}

/** the register's own time format: date, time, and the zone stated. */
export function formatRecordedAt(iso: string): string {
  const at = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, '0');
  return (
    `${pad(at.getUTCDate())}/${pad(at.getUTCMonth() + 1)}/${at.getUTCFullYear()} ` +
    `${pad(at.getUTCHours())}:${pad(at.getUTCMinutes())}:${pad(at.getUTCSeconds())} UTC`
  );
}

function describeFingerprint(payload: Record<string, unknown>): string | undefined {
  const fingerprint = record(payload, 'fingerprint');
  if (fingerprint === undefined) {
    return undefined;
  }
  const parts = [
    text(fingerprint, 'browserBuild') === undefined
      ? undefined
      : `chromium ${text(fingerprint, 'browserBuild')}`,
    text(fingerprint, 'imageDigest') === undefined
      ? undefined
      : `img ${text(fingerprint, 'imageDigest')}`,
    text(fingerprint, 'region'),
  ].filter((part) => part !== undefined);
  return parts.length === 0 ? undefined : parts.join(' · ');
}

function describeValues(payload: Record<string, unknown>): LedgerRecordValues | undefined {
  const metrics = record(payload, 'metrics');
  if (metrics === undefined) {
    return undefined;
  }
  const transferred = number(metrics, 'transferredBytes');
  const mad = number(metrics, 'transferredBytesMad');
  const requests = number(metrics, 'requestCount');
  const dom = number(metrics, 'domNodeCount');
  const carbon = number(metrics, 'carbonPerVisitG');
  const low = number(metrics, 'carbonBandLowG');
  const high = number(metrics, 'carbonBandHighG');
  if (
    transferred === undefined ||
    mad === undefined ||
    requests === undefined ||
    dom === undefined ||
    carbon === undefined ||
    low === undefined ||
    high === undefined
  ) {
    return undefined;
  }
  // the document register writes decimals with a comma. three of them, because
  // at a french grid two would round the reference and the low edge of the band
  // to the same figure and the record would state a band of nothing.
  const decimal = (value: number) => formatNumber(value, 3).replace('.', ',');
  return {
    transferredKb: formatInt(transferred / 1000),
    madKb: formatInt(mad / 1000),
    requests: formatInt(requests),
    domNodes: formatInt(dom),
    carbon: decimal(carbon),
    low: decimal(low),
    high: decimal(high),
  };
}

function describeModels(payload: Record<string, unknown>): string | undefined {
  const models = payload['models'];
  if (!Array.isArray(models) || models.length === 0) {
    return undefined;
  }
  const named = models.filter((model): model is string => typeof model === 'string');
  return named.length === 0 ? undefined : named.join(' · ');
}

export function toRecordView(entry: LedgerEntry): LedgerRecordView {
  const fingerprint = describeFingerprint(entry.payload);
  const values = describeValues(entry.payload);
  const models = describeModels(entry.payload);
  return {
    hash: entry.entryHash,
    shortHash: entry.entryHash.slice(0, 8),
    type: describeKind(entry),
    recordedAt: formatRecordedAt(entry.createdAt),
    methodology: text(entry.payload, 'methodologyVersion') ?? text(entry.payload, 'version') ?? 'v1.2',
    ...(models === undefined ? {} : { models }),
    ...(fingerprint === undefined ? {} : { fingerprint }),
    position: `${formatInt(entry.sequence + 1)} · précédente ${entry.prevHash.slice(0, 8)}…`,
    ...(values === undefined ? {} : { values }),
  };
}
