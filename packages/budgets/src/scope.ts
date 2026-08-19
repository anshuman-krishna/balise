import type { AggregatedMetrics, BudgetScope, NoiseFloor } from '@balise/schemas';

/**
 * one measured scenario, as the caller recorded it. a scenario is a page or a
 * scripted journey; journeys are first class here because rgesn audits are
 * scoped to journeys as well as pages.
 */
export interface ScenarioMeasurement {
  /** stable id. a route path for a page, the journey id for a journey. */
  id: string;
  kind: 'route' | 'journey';
  /** what a screen calls it. */
  label: string;
  /** the path a route budget matches against. defaults to the id. */
  route?: string;
  /** the aggregate under assessment. cold and warm are never mixed upstream. */
  candidate: AggregatedMetrics;
  /** the branch baseline, needed only by relative rules. */
  baseline?: AggregatedMetrics;
  floors: readonly NoiseFloor[];
}

/**
 * `*` matches within one path segment, `**` matches the rest of the path.
 * the distinction is documented rather than clever: a budget on
 * `/demarches/*` should not silently start covering `/demarches/a/b`.
 */
export function routeMatches(pattern: string, route: string): boolean {
  const expression = pattern
    .split('**')
    .map((part) =>
      part
        .split('*')
        .map((literal) => literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('[^/]+'),
    )
    .join('.*');
  return new RegExp(`^${expression}$`).test(route);
}

export function scopeMatches(scope: BudgetScope, scenario: ScenarioMeasurement): boolean {
  switch (scope.kind) {
    // a service-wide limit holds everywhere it was measured. checking it
    // against an aggregate instead would let it pass while a route breached.
    case 'service':
      return true;
    case 'journey':
      return scenario.kind === 'journey' && scenario.id === scope.journey;
    case 'route':
      return scenario.kind === 'route' && routeMatches(scope.pattern, scenario.route ?? scenario.id);
  }
}

export function scopeLabel(scope: BudgetScope): string {
  switch (scope.kind) {
    case 'service':
      return 'service';
    case 'journey':
      return `journey:${scope.journey}`;
    case 'route':
      return scope.pattern;
  }
}

export function sameScope(left: BudgetScope, right: BudgetScope): boolean {
  return scopeLabel(left) === scopeLabel(right);
}
