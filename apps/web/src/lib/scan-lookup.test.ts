import { describe, expect, it } from 'vitest';
import { scanFixture } from '../fixtures/canon';
import { lookupScan, normaliseDomain } from './scan-lookup';

describe('normaliseDomain', () => {
  it('strips scheme, www, path, case and trailing dot', () => {
    expect(normaliseDomain('  HTTPS://www.Bibliotheques-Selo.fr/accueil ')).toBe('bibliotheques-selo.fr');
    expect(normaliseDomain('bibliotheques-selo.fr.')).toBe('bibliotheques-selo.fr');
  });

  it('leaves a bare domain untouched', () => {
    expect(normaliseDomain('sevre-et-loire.fr')).toBe('sevre-et-loire.fr');
  });
});

describe('lookupScan', () => {
  it('reports the measured domain however it was typed', () => {
    expect(lookupScan('https://bibliotheques-selo.fr/', scanFixture.domain)).toEqual({ status: 'measured' });
  });

  it('reports no record for a domain we hold no capture for', () => {
    expect(lookupScan('exemple.fr', scanFixture.domain)).toEqual({
      status: 'no-record',
      domain: 'exemple.fr',
    });
  });

  it('does not treat a subdomain of the measured host as measured', () => {
    expect(lookupScan('archives.bibliotheques-selo.fr', scanFixture.domain).status).toBe('no-record');
  });
});
