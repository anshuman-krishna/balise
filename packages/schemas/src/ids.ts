import { z } from 'zod';

// Branded identifiers: strings at runtime, distinct at compile time.
// Passing a RunId where a ServiceId is expected must fail to compile.

export const OrganizationId = z.string().min(1).brand<'OrganizationId'>();
export type OrganizationId = z.infer<typeof OrganizationId>;

export const ProjectId = z.string().min(1).brand<'ProjectId'>();
export type ProjectId = z.infer<typeof ProjectId>;

export const ServiceId = z.string().min(1).brand<'ServiceId'>();
export type ServiceId = z.infer<typeof ServiceId>;

export const ScenarioId = z.string().min(1).brand<'ScenarioId'>();
export type ScenarioId = z.infer<typeof ScenarioId>;

export const RunId = z.string().min(1).brand<'RunId'>();
export type RunId = z.infer<typeof RunId>;

// Criterion ids are the official referential ids ("4.3"). Never renumbered.
export const CriterionId = z.string().min(1).brand<'CriterionId'>();
export type CriterionId = z.infer<typeof CriterionId>;
