import { describe, expect, it } from 'vitest';
import { AttributionReport } from '@balise/schemas';
import { attribute } from '../src/report.js';
import type { AttributionSide } from '../src/report.js';
import { buildBundle, byteLength } from './fixtures/bundle-builder.js';

const ORIGIN = 'https://sevre-et-loire.fr';

const MAIN = 'const app=document.querySelector("#app");';
const MAIN_AFTER = 'import{fr}from"date-fns/locale";const app=document.querySelector("#app");';
const REACT = 'export function createElement(){/* react */}';
const RUNTIME = 'boot(app);';

// the injected regression: three locale files nobody meant to ship.
const LOCALES = [
  { source: 'webpack://selo/./node_modules/date-fns/locale/fr/index.js', code: `export const fr={${'x'.repeat(4_000)}};` },
  { source: 'webpack://selo/./node_modules/date-fns/locale/br/index.js', code: `export const br={${'y'.repeat(3_500)}};` },
  { source: 'webpack://selo/./node_modules/date-fns/locale/index.js', code: `export * from "./fr";${'z'.repeat(500)}` },
];

const baselineBundle = buildBundle('https://sevre-et-loire.fr/assets/app.a3f2.js', [
  { source: 'webpack://selo/./src/main.ts', code: MAIN },
  { source: 'webpack://selo/./node_modules/react/index.js', code: REACT },
  { source: 'webpack://selo/./src/runtime.ts', code: RUNTIME },
]);

const candidateBundle = buildBundle('https://sevre-et-loire.fr/assets/app.b81c.js', [
  { source: 'webpack://selo/./src/main.ts', code: MAIN_AFTER },
  { source: 'webpack://selo/./node_modules/react/index.js', code: REACT },
  ...LOCALES,
  { source: 'webpack://selo/./src/runtime.ts', code: RUNTIME },
]);

function sideFor(bundle: typeof baselineBundle, extra: AttributionSide['resources'] = []): AttributionSide {
  return {
    serviceOrigin: ORIGIN,
    resources: [
      { url: `${ORIGIN}/demarches/acte-naissance`, transferredBytes: 12_000, decodedBytes: 48_000 },
      {
        url: bundle.url,
        // compressed on the wire, which is not the quantity a source map explains.
        transferredBytes: Math.round(byteLength(bundle.content) / 3),
        decodedBytes: byteLength(bundle.content),
      },
      ...extra,
    ],
    bundles: [{ url: bundle.url, content: bundle.content, sourceMap: bundle.sourceMap }],
  };
}

const before = sideFor(baselineBundle);
const after = sideFor(candidateBundle, [
  { url: 'https://player.dailymotion.com/embed.js', transferredBytes: 198_000, decodedBytes: 640_000 },
]);

describe('attribute', () => {
  const report = attribute(before, after);

  it('names the dependency behind the growth', () => {
    expect(report.modules.packages[0]!.packageName).toBe('date-fns');
  });

  it('sizes it at exactly the bytes that were injected', () => {
    const injected = LOCALES.reduce((total, module) => total + byteLength(module.code), 0);
    expect(report.modules.packages[0]!.delta).toBe(injected);
    expect(report.modules.packages[0]!.moduleCount).toBe(3);
  });

  it('reports the first-party file that pulled it in', () => {
    const main = report.modules.modules.find((row) => row.path === 'src/main.ts');
    expect(main).toMatchObject({ status: 'grown', packageName: null });
    expect(main!.delta).toBe(byteLength(MAIN_AFTER) - byteLength(MAIN));
  });

  it('leaves an untouched module unchanged', () => {
    const react = report.modules.modules.find((row) => row.path.includes('react'));
    expect(react?.status).toBe('unchanged');
  });

  it('accounts for the whole measured change', () => {
    const measured = byteLength(candidateBundle.content) - byteLength(baselineBundle.content);
    expect(report.reconciliation.measuredDelta).toBe(measured);
    expect(report.reconciliation.explainedDelta).toBe(measured);
    expect(report.reconciliation.unexplainedDelta).toBe(0);
    expect(report.reconciliation.complete).toBe(true);
  });

  it('does not confuse the transferred delta with the decoded one', () => {
    expect(report.resources.transferred.delta).not.toBe(report.reconciliation.measuredDelta);
    expect(report.resources.decoded.delta).toBeGreaterThan(report.resources.transferred.delta);
  });

  it('shows the bundle rename as a removal and an addition', () => {
    const bundleRows = report.resources.changes.filter((row) => row.url.includes('/assets/'));
    expect(bundleRows.map((row) => row.status).sort()).toEqual(['added', 'removed']);
  });

  it('finds the new third-party origin alongside the bundle growth', () => {
    expect(report.origins.newThirdPartyOrigins).toBe(1);
    expect(report.origins.changes[0]!.vendor?.label).toBe('Dailymotion');
  });

  it('matches the published contract', () => {
    expect(() => AttributionReport.parse(report)).not.toThrow();
  });
});

describe('attribute, when a bundle cannot be read', () => {
  const blind: AttributionSide = {
    ...after,
    bundles: [{ url: candidateBundle.url, content: candidateBundle.content }],
  };
  const report = attribute(before, blind);

  it('says which bundle and why', () => {
    expect(report.bundles.after).toEqual([
      { status: 'unavailable', url: candidateBundle.url, reason: 'no-source-map' },
    ]);
  });

  it('claims nothing about modules', () => {
    expect(report.modules.complete).toBe(false);
    expect(report.modules.modules).toEqual([]);
    expect(report.modules.packages).toEqual([]);
  });

  it('leaves the whole measured change unexplained rather than partly explained', () => {
    const measured = byteLength(candidateBundle.content) - byteLength(baselineBundle.content);
    expect(report.reconciliation.explainedDelta).toBe(0);
    expect(report.reconciliation.unexplainedDelta).toBe(measured);
    expect(report.reconciliation.complete).toBe(false);
  });

  it('still reports what was measured', () => {
    expect(report.resources.transferred.delta).toBeGreaterThan(0);
    expect(report.origins.newThirdPartyOrigins).toBe(1);
  });
});
