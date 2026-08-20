import type { RawCapture } from '@balise/schemas';
import { CORPUS_CAPTURES, SCAN_CAPTURE } from './capture-canon-source';

/**
 * the services the fleet and the public index hold, and everything about them
 * that is not a measurement.
 *
 * a declaration's version and age, a contract reference, the agency that
 * manages the service: those are facts about publication and about contracts,
 * so they are authored here. every number derived from them is not. the tone a
 * stale declaration is drawn in used to be typed beside its age, which is how
 * a declaration 426 days old came to be drawn in caution where the referential
 * asks for one a year.
 *
 * this file is the only place a service is named. the measurement canon builds
 * a scenario per entry and the corpus canon reads the result back, so a row's
 * weight, its rank and its place in the histogram are one measurement seen
 * three times.
 */

export type Sector = 'epci' | 'communes' | 'etat' | 'sante' | 'transport' | 'departements';

/** the agency this build is a tenant of. its services are the fleet. */
export const TENANT_AGENCY = 'Sextant';

export interface CorpusService {
  domain: string;
  organisme: string;
  sector: Sector;
  /** the agency that manages it. null where the service is managed in house. */
  agency: string | null;
  /** the home page, measured. */
  capture: RawCapture;
  /**
   * what the same page weighed ninety days ago. the trend is the difference
   * between two measurements read against the scenario's floor, never a
   * percentage authored beside a row.
   */
  priorTransferredBytes: number;
  /**
   * how many aggregations sit behind it. below the kernel's minimum there is
   * no floor, so there is no trend either, and the surface says so instead of
   * drawing an arrow.
   */
  historyCount: number;
  /** the published declaration, where the service has one. */
  declaration: { version: number; ageDays: number } | null;
  /** the contract we hold for it. */
  contract: string | null;
  /**
   * the green web foundation check, with the date it was made. null where the
   * host was never checked, and then the estimate carries no green credit at
   * all: a hosting claim nobody made is not a hosting claim, and a factor of
   * one would silently zero the data centre term for every unchecked service
   * in the index.
   */
  greenHosting: { verified: boolean; checkedAt: string } | null;
  /**
   * rgesn conformity, where the agency has assessed it. null for the audited
   * service: the criteria engine answers that one, and repeating the rate here
   * would be a seventh place for it to disagree with itself.
   */
  rgesnPct: number | null;
}

/** twenty-four aggregations: enough history for a floor, on a weekly index. */
const ESTABLISHED = 24;

export const CORPUS_SERVICES: readonly CorpusService[] = [
  {
    domain: 'craonnais.fr',
    organisme: 'Ville de Craonnais',
    sector: 'communes',
    agency: TENANT_AGENCY,
    capture: CORPUS_CAPTURES['craonnais.fr']!,
    priorTransferredBytes: 244_000,
    historyCount: ESTABLISHED,
    declaration: { version: 4, ageDays: 21 },
    contract: null,
    greenHosting: { verified: true, checkedAt: '2026-08-15' },
    rgesnPct: 82,
  },
  {
    domain: 'mairie-lanvaux.fr',
    organisme: 'Commune de Lanvaux',
    sector: 'communes',
    agency: null,
    capture: CORPUS_CAPTURES['mairie-lanvaux.fr']!,
    priorTransferredBytes: 316_000,
    historyCount: ESTABLISHED,
    declaration: { version: 1, ageDays: 402 },
    contract: null,
    greenHosting: null,
    rgesnPct: null,
  },
  {
    domain: 'ville-de-plessac.fr',
    organisme: 'Commune de Plessac',
    sector: 'communes',
    agency: null,
    capture: CORPUS_CAPTURES['ville-de-plessac.fr']!,
    priorTransferredBytes: 404_000,
    historyCount: ESTABLISHED,
    declaration: { version: 1, ageDays: 311 },
    contract: null,
    greenHosting: null,
    rgesnPct: null,
  },
  {
    domain: 'musees-selo.fr',
    organisme: 'Musées de Sèvre-et-Loire',
    sector: 'epci',
    agency: 'Kerlann',
    capture: CORPUS_CAPTURES['musees-selo.fr']!,
    priorTransferredBytes: 588_000,
    historyCount: ESTABLISHED,
    declaration: { version: 3, ageDays: 64 },
    contract: null,
    greenHosting: { verified: true, checkedAt: '2026-08-12' },
    rgesnPct: null,
  },
  {
    domain: 'prefecture-arvor.fr',
    organisme: "Préfecture d'Arvor",
    sector: 'etat',
    agency: null,
    capture: CORPUS_CAPTURES['prefecture-arvor.fr']!,
    priorTransferredBytes: 716_000,
    historyCount: ESTABLISHED,
    declaration: { version: 2, ageDays: 178 },
    contract: null,
    greenHosting: { verified: false, checkedAt: '2026-08-15' },
    rgesnPct: null,
  },
  {
    domain: 'sevre-et-loire.fr',
    organisme: 'Métropole de Sèvre-et-Loire',
    sector: 'epci',
    agency: TENANT_AGENCY,
    capture: CORPUS_CAPTURES['sevre-et-loire.fr']!,
    priorTransferredBytes: 925_000,
    historyCount: ESTABLISHED,
    declaration: { version: 2, ageDays: 156 },
    contract: '0417 · Q3 due',
    greenHosting: { verified: true, checkedAt: '2026-08-15' },
    rgesnPct: null,
  },
  {
    // the page the free scan measured, measured again on the index's terms.
    // one capture, so the two surfaces agree on what the page weighs; five
    // runs and a history against one cold pass, so they disagree about how
    // much is known about it, which is the difference between a scan and a
    // series.
    domain: 'bibliotheques-selo.fr',
    organisme: 'Réseau des bibliothèques de Sèvre-et-Loire',
    sector: 'communes',
    agency: TENANT_AGENCY,
    capture: SCAN_CAPTURE,
    priorTransferredBytes: 962_000,
    historyCount: ESTABLISHED,
    declaration: null,
    contract: null,
    greenHosting: { verified: true, checkedAt: '2026-08-15' },
    rgesnPct: 71,
  },
  {
    domain: 'eau-selo.fr',
    organisme: 'Régie des eaux de Sèvre-et-Loire',
    sector: 'epci',
    agency: TENANT_AGENCY,
    capture: CORPUS_CAPTURES['eau-selo.fr']!,
    priorTransferredBytes: 1_088_000,
    historyCount: ESTABLISHED,
    declaration: { version: 2, ageDays: 88 },
    contract: null,
    greenHosting: { verified: true, checkedAt: '2026-08-15' },
    rgesnPct: 64,
  },
  {
    domain: 'ars-bretagne.fr',
    organisme: 'ARS Bretagne',
    sector: 'etat',
    agency: null,
    capture: CORPUS_CAPTURES['ars-bretagne.fr']!,
    priorTransferredBytes: 1_624_000,
    historyCount: ESTABLISHED,
    declaration: { version: 1, ageDays: 290 },
    contract: null,
    greenHosting: null,
    rgesnPct: null,
  },
  {
    domain: 'transports-selo.fr',
    organisme: 'Réseau Naïade',
    sector: 'transport',
    agency: TENANT_AGENCY,
    capture: CORPUS_CAPTURES['transports-selo.fr']!,
    priorTransferredBytes: 1_805_000,
    historyCount: ESTABLISHED,
    declaration: { version: 1, ageDays: 248 },
    contract: '0392 · active',
    greenHosting: { verified: false, checkedAt: '2026-08-15' },
    rgesnPct: 44,
  },
  {
    // measured for eleven weeks, which is under the twenty aggregations the
    // floor needs. no floor, so no trend and lower confidence, and both are
    // the kernel's answer rather than a cell left blank in a fixture.
    domain: 'chu-armorique.fr',
    organisme: "CHU d'Armorique",
    sector: 'sante',
    agency: TENANT_AGENCY,
    capture: CORPUS_CAPTURES['chu-armorique.fr']!,
    priorTransferredBytes: 2_980_000,
    historyCount: 11,
    declaration: { version: 1, ageDays: 426 },
    contract: null,
    greenHosting: { verified: false, checkedAt: '2026-08-15' },
    rgesnPct: 38,
  },
  {
    domain: 'portail-arvor.fr',
    organisme: "Département d'Arvor",
    sector: 'departements',
    agency: null,
    capture: CORPUS_CAPTURES['portail-arvor.fr']!,
    priorTransferredBytes: 3_297_000,
    historyCount: ESTABLISHED,
    declaration: null,
    contract: null,
    greenHosting: null,
    rgesnPct: null,
  },
];

/** the scenario a corpus service is measured under. */
export function corpusScenarioId(domain: string): string {
  return `corpus:${domain}`;
}

/** the aggregation ninety days before the one the index publishes. */
export function corpusPriorId(domain: string): string {
  return `corpus:${domain}:prior`;
}
