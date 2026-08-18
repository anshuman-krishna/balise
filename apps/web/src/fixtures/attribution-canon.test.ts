import { describe, expect, it } from 'vitest';
import { ModuleBlame, ModuleChange, OriginChange, PackageChange, Reconciliation } from '@balise/schemas';
import { attributeBundle } from '@balise/attribution';
import { buildAttributionCanon, BASELINE_BUILD, CANDIDATE_BUILD } from '../../scripts/attribution-canon-source';
import { attributionCanon } from './attribution-canon';

// the generated file is data, and data drifts. this recomputes the whole
// attribution from the two builds and holds the checked-in copy to it, so a
// hand edit or a change in the attribution package cannot pass unnoticed.
const canon = await buildAttributionCanon();

describe('the generated attribution canon', () => {
  it('matches what the engine produces from the two builds', () => {
    expect(attributionCanon.modules).toEqual(canon.report.modules.modules.filter((row) => row.delta !== 0));
    expect(attributionCanon.packages).toEqual(canon.report.modules.packages);
    expect(attributionCanon.reconciliation).toEqual(canon.report.reconciliation);
    expect(attributionCanon.unattributed).toEqual(canon.report.modules.unattributed);
    expect(attributionCanon.blame).toEqual(canon.blame);
    expect(attributionCanon.origins).toEqual(canon.report.origins.changes.filter((row) => row.party === 'third'));
    expect(attributionCanon.thirdPartyBundle).toEqual(canon.thirdPartyBundle);
  });

  it('holds shapes that satisfy the published contracts', () => {
    expect(() => ModuleChange.array().parse(attributionCanon.modules)).not.toThrow();
    expect(() => PackageChange.array().parse(attributionCanon.packages)).not.toThrow();
    expect(() => OriginChange.array().parse(attributionCanon.origins)).not.toThrow();
    expect(() => ModuleBlame.array().parse(attributionCanon.blame)).not.toThrow();
    expect(() => Reconciliation.parse(attributionCanon.reconciliation)).not.toThrow();
  });
});

describe('the canon regression', () => {
  it('names date-fns and sizes it at the bytes the two builds differ by', () => {
    expect(attributionCanon.packages).toHaveLength(1);
    expect(attributionCanon.packages[0]).toMatchObject({
      packageName: 'date-fns',
      delta: 160_000,
      // every module of the package that is present on either side, not only
      // the ones that changed: three core files were already there.
      moduleCount: 6,
      status: 'grown',
    });
    const added = attributionCanon.modules.filter((row) => row.packageName === 'date-fns');
    expect(added).toHaveLength(3);
  });

  it('names the first-party file that pulled it in', () => {
    const file = attributionCanon.modules.find((row) => row.path === 'src/lib/dates.ts');
    expect(file).toMatchObject({ status: 'grown', delta: 120, packageName: null });
  });

  it('blames a person for the first-party file and nobody for the dependency', () => {
    const file = attributionCanon.blame.find((row) => row.path === 'src/lib/dates.ts');
    if (file?.status !== 'attributed') throw new Error('expected an attributed file');
    expect(file.commits[0]!.shortSha).toBe('a7f2c91');
    expect(file.commits[0]!.author).toBe('c. bellanger');

    const locale = attributionCanon.blame.find((row) => row.path.includes('date-fns'));
    if (locale?.status !== 'unavailable') throw new Error('expected unavailable');
    expect(locale.reason).toBe('third-party-module');
  });

  it('leaves the bundler overhead unexplained instead of attributing it', () => {
    expect(attributionCanon.reconciliation).toEqual({
      measuredDelta: 184_000,
      explainedDelta: 160_120,
      unexplainedDelta: 23_880,
      complete: true,
    });
    // the unexplained bytes are exactly the growth in what no mapping covers.
    expect(attributionCanon.unattributed.delta).toBe(23_880);
  });

  it('reports the content-hashed rename as one removal and one addition', () => {
    expect(attributionCanon.bundle.rows.map((row) => row.status).sort()).toEqual(['added', 'removed']);
    expect(attributionCanon.bundle.rows.every((row) => row.decodedDelta === null)).toBe(true);
  });

  it('finds the new third-party origin and names its vendor', () => {
    const player = attributionCanon.origins.find((row) => row.origin.includes('dailymotion'));
    expect(player).toMatchObject({ status: 'added', transferredDelta: 198_000 });
    expect(player?.vendor?.label).toBe('Dailymotion');
  });

  it('says why the player cannot be explained further', () => {
    expect(attributionCanon.thirdPartyBundle).toMatchObject({
      status: 'unavailable',
      reason: 'no-source-map',
    });
  });
});

describe('the two builds', () => {
  it('are the sizes the comparison fixture publishes for them', () => {
    expect(BASELINE_BUILD.content.length).toBe(286_000);
    expect(CANDIDATE_BUILD.content.length).toBe(470_000);
  });

  it('carry maps that account for every byte they contain', () => {
    for (const build of [BASELINE_BUILD, CANDIDATE_BUILD]) {
      const result = attributeBundle(build);
      if (result.status !== 'resolved') throw new Error(`expected resolved, got ${result.reason}`);
      const attributed = result.sources.reduce((total, source) => total + source.bytes, 0);
      expect(attributed + result.unattributedBytes).toBe(build.content.length);
    }
  });
});
