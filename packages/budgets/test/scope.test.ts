import { describe, expect, it } from 'vitest';
import { routeMatches, sameScope, scopeLabel } from '../src/scope.js';

describe('route patterns', () => {
  it('matches a literal route', () => {
    expect(routeMatches('/accueil', '/accueil')).toBe(true);
    expect(routeMatches('/accueil', '/accueil/sous-page')).toBe(false);
  });

  it('keeps a single star inside one path segment', () => {
    // a budget on /demarches/* should not silently start covering everything
    // that happens to live deeper in the tree.
    expect(routeMatches('/demarches/*', '/demarches/acte-naissance')).toBe(true);
    expect(routeMatches('/demarches/*', '/demarches/actes/naissance')).toBe(false);
    expect(routeMatches('/demarches/*', '/demarches/')).toBe(false);
    expect(routeMatches('/demarches/*', '/demarches')).toBe(false);
  });

  it('lets a double star cross segments, because that is what it is for', () => {
    expect(routeMatches('/demarches/**', '/demarches/actes/naissance')).toBe(true);
    expect(routeMatches('/**', '/anything/at/all')).toBe(true);
  });

  it('treats regex characters in a pattern as literal text', () => {
    expect(routeMatches('/a.b', '/axb')).toBe(false);
    expect(routeMatches('/a.b', '/a.b')).toBe(true);
    expect(routeMatches('/a+b', '/a+b')).toBe(true);
  });
});

describe('scope identity', () => {
  it('names a scope the way the file wrote it', () => {
    expect(scopeLabel({ kind: 'service' })).toBe('service');
    expect(scopeLabel({ kind: 'journey', journey: 'demande-acte' })).toBe('journey:demande-acte');
    expect(scopeLabel({ kind: 'route', pattern: '/demarches/*' })).toBe('/demarches/*');
  });

  it('compares two scopes by what they name', () => {
    expect(sameScope({ kind: 'route', pattern: '/a' }, { kind: 'route', pattern: '/a' })).toBe(true);
    expect(sameScope({ kind: 'route', pattern: '/a' }, { kind: 'route', pattern: '/b' })).toBe(false);
    expect(sameScope({ kind: 'service' }, { kind: 'journey', journey: 'service' })).toBe(false);
  });
});
