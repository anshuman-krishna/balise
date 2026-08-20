import { describe, expect, it } from 'vitest';
import { classifyDelta, getAggregatedMetric } from '@balise/measure-core';
import { computeEcoIndexScore, ecoIndexGrade } from '@balise/carbon-models';
import { buildCorpusCanon } from '../../scripts/corpus-canon-source';
import { canonAggregate, canonMetric } from '../../scripts/measurement-canon-source';
import { corpusPriorId } from '../../scripts/corpus-services';
import { corpusCanon } from './corpus-canon';

// the generated file is data, and data drifts. this rebuilds the corpus and
// holds the checked-in copy to it.
const built = buildCorpusCanon();

describe('the generated corpus canon', () => {
  it('matches what the kernel and the models produce', () => {
    expect(JSON.parse(JSON.stringify(corpusCanon))).toEqual(JSON.parse(JSON.stringify(built)));
  });

  it('states the size of the corpus it holds', () => {
    // the version of this said 412 and held six rows, on a public page, about
    // measurements nobody had made.
    expect(corpusCanon.size).toBe(corpusCanon.rows.length);
    expect(corpusCanon.benchmark.serviceCount).toBe(corpusCanon.rows.length);
    expect(corpusCanon.withoutDeclaration).toBe(
      corpusCanon.rows.filter((row) => row.declaration.state === 'none').length,
    );
  });

  it('ranks by the measured quantity it says it ranks by, with no gaps', () => {
    const ranks = corpusCanon.rows.map((row) => row.rank);
    expect(ranks).toEqual(corpusCanon.rows.map((_, index) => index + 1));
    for (let index = 1; index < corpusCanon.rows.length; index += 1) {
      expect(corpusCanon.rows[index]!.measured.transferredBytes).toBeGreaterThanOrEqual(
        corpusCanon.rows[index - 1]!.measured.transferredBytes,
      );
    }
  });

  it('reads every row off the measurement the canon publishes for it', () => {
    for (const row of corpusCanon.rows) {
      expect(row.measured.transferredBytes).toBe(
        canonMetric(row.scenarioId, 'transferred_bytes').median,
      );
      expect(row.measured.requestCount).toBe(canonMetric(row.scenarioId, 'request_count').median);
      expect(row.measured.domNodeCount).toBe(canonMetric(row.scenarioId, 'dom_node_count').median);
      expect(row.confidence).toBe(canonMetric(row.scenarioId, 'transferred_bytes').confidence);
    }
  });

  it('grades every row from the metrics printed beside it', () => {
    // the table this replaced carried a letter per row and no dom count and no
    // request count, so no grade on it could have come from the model that
    // produces grades. sevre-et-loire was printed at B where the model says D.
    for (const row of corpusCanon.rows) {
      const score = computeEcoIndexScore(
        row.measured.domNodeCount,
        row.measured.requestCount,
        row.measured.transferredBytes / 1000,
      );
      expect(row.carbon.score).toBeCloseTo(score, 10);
      expect(row.carbon.grade).toBe(ecoIndexGrade(score));
    }
  });

  it('classifies every trend through the kernel, against the scenario floor', () => {
    for (const row of corpusCanon.rows) {
      const delta = classifyDelta(
        getAggregatedMetric(canonAggregate(corpusPriorId(row.domain)), 'transferred_bytes')!,
        getAggregatedMetric(canonAggregate(row.scenarioId), 'transferred_bytes')!,
        canonMetric(row.scenarioId, 'transferred_bytes').floor,
      );
      expect(row.trend.classification).toBe(delta.classification);
      expect(row.trend.before).toBe(delta.before);
      expect(row.trend.after).toBe(delta.after);
    }
  });

  it('reports no trend where the scenario has no floor', () => {
    for (const row of corpusCanon.rows) {
      const floor = canonMetric(row.scenarioId, 'transferred_bytes').floor;
      if (floor.status !== 'established') {
        expect(row.trend.classification).toBe('indeterminate');
        // and the same missing floor grades the figure low, which is the rule
        // METHODOLOGY.md section 7 states and section 9's table used to omit.
        expect(row.confidence).toBe('low');
      }
    }
    // one service in the corpus is in that state, so the assertion above is
    // not passing on an empty set.
    expect(
      corpusCanon.rows.filter((row) => row.trend.classification === 'indeterminate'),
    ).toHaveLength(1);
  });

  it('credits no green hosting to a host nobody checked', () => {
    const unchecked = corpusCanon.rows.filter((row) => row.hosting.state !== 'verified');
    expect(unchecked.length).toBeGreaterThan(0);
    for (const row of unchecked) {
      expect(row.hosting.checkedAt === null || row.hosting.state === 'standard').toBe(true);
    }
    // a verified host names the date it was verified on. a hosting claim with
    // no date is worthless eight months into an audit.
    for (const row of corpusCanon.rows.filter((row) => row.hosting.state === 'verified')) {
      expect(row.hosting.checkedAt).not.toBeNull();
    }
  });

  it('draws the histogram from the corpus rather than from a mockup', () => {
    const counted = corpusCanon.benchmark.buckets.reduce((sum, bucket) => sum + bucket.count, 0);
    expect(counted).toBe(corpusCanon.rows.length);
    expect(corpusCanon.benchmark.max).toBe(
      Math.max(...corpusCanon.rows.map((row) => row.measured.transferredBytes)),
    );
    for (const bucket of corpusCanon.benchmark.buckets) {
      expect(bucket.to).toBeGreaterThan(bucket.from);
    }
  });

  it('keeps every band inside the shared scale both tables are drawn on', () => {
    for (const row of corpusCanon.rows) {
      expect(row.carbon.low).toBeGreaterThanOrEqual(corpusCanon.scale.min);
      expect(row.carbon.high).toBeLessThanOrEqual(corpusCanon.scale.max);
      expect(row.carbon.reference).toBeGreaterThanOrEqual(row.carbon.low);
      expect(row.carbon.reference).toBeLessThanOrEqual(row.carbon.high);
    }
  });
});
