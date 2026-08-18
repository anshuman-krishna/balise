import { describe, expect, it } from 'vitest';
import { classifyUrl, diffOrigins, diffResources, type ResourceSideInput } from '../src/resources.js';
import { identifyVendor } from '../src/vendors.js';

const ORIGIN = 'https://sevre-et-loire.fr';

function side(resources: ResourceSideInput['resources']): ResourceSideInput {
  return { serviceOrigin: ORIGIN, resources };
}

describe('classifyUrl', () => {
  it('separates the service origin from everything else', () => {
    expect(classifyUrl(`${ORIGIN}/app.js`, ORIGIN).party).toBe('first');
    expect(classifyUrl('https://matomo.selo.fr/x.js', ORIGIN).party).toBe('third');
  });

  it('treats a different port or scheme as a different origin', () => {
    expect(classifyUrl('http://sevre-et-loire.fr/a.js', ORIGIN).party).toBe('third');
    expect(classifyUrl('https://sevre-et-loire.fr:8443/a.js', ORIGIN).party).toBe('third');
  });

  it('reports an unparseable url as unknown rather than as our own', () => {
    expect(classifyUrl('not a url', ORIGIN).party).toBe('unknown');
  });

  it('counts inline data with the document that carried it', () => {
    expect(classifyUrl('data:image/svg+xml;base64,AAA', ORIGIN)).toMatchObject({ key: 'data:', party: 'first' });
  });
});

describe('diffResources', () => {
  it('pairs on the exact url and reports the rest as added or removed', () => {
    const diff = diffResources(
      side([{ url: `${ORIGIN}/app.a3f2.js`, transferredBytes: 40_000 }]),
      side([{ url: `${ORIGIN}/app.b81c.js`, transferredBytes: 62_000 }]),
    );
    // a content hash in the file name is a removal and an addition at the
    // network level. pairing them by name would be a guess.
    expect(diff.changes.map((row) => row.status).sort()).toEqual(['added', 'removed']);
    expect(diff.transferred).toMatchObject({ before: 40_000, after: 62_000, delta: 22_000 });
  });

  it('sums repeated requests for one url and counts them', () => {
    const diff = diffResources(
      side([{ url: `${ORIGIN}/a.png`, transferredBytes: 100 }]),
      side([
        { url: `${ORIGIN}/a.png`, transferredBytes: 100 },
        { url: `${ORIGIN}/a.png#second`, transferredBytes: 100 },
      ]),
    );
    const row = diff.changes[0]!;
    expect(row.afterRequests).toBe(2);
    expect(row.afterTransferredBytes).toBe(200);
  });

  it('leaves the decoded delta null when either side did not measure it', () => {
    const diff = diffResources(
      side([{ url: `${ORIGIN}/a.js`, transferredBytes: 100 }]),
      side([{ url: `${ORIGIN}/a.js`, transferredBytes: 120, decodedBytes: 400 }]),
    );
    const row = diff.changes[0]!;
    expect(row.beforeDecodedBytes).toBeNull();
    expect(row.decodedDelta).toBeNull();
    // the transferred size is never used to stand in for the decoded one.
    expect(row.afterDecodedBytes).toBe(400);
    expect(diff.decoded.complete).toBe(false);
  });

  it('reports decoded totals as complete only when every resource carried one', () => {
    const diff = diffResources(
      side([{ url: `${ORIGIN}/a.js`, transferredBytes: 100, decodedBytes: 300 }]),
      side([{ url: `${ORIGIN}/a.js`, transferredBytes: 120, decodedBytes: 400 }]),
    );
    expect(diff.decoded).toEqual({ before: 300, after: 400, delta: 100, complete: true });
  });
});

describe('diffOrigins', () => {
  const before = side([
    { url: `${ORIGIN}/app.js`, transferredBytes: 40_000 },
    { url: 'https://matomo.selo.fr/matomo.js', transferredBytes: 72_000 },
  ]);
  const after = side([
    { url: `${ORIGIN}/app.js`, transferredBytes: 40_000 },
    { url: 'https://matomo.selo.fr/matomo.js', transferredBytes: 72_000 },
    { url: 'https://player.dailymotion.com/embed.js', transferredBytes: 198_000 },
    { url: 'https://player.dailymotion.com/poster.jpg', transferredBytes: 22_000 },
  ]);

  it('finds the new third-party origin and sizes it', () => {
    const diff = diffOrigins(before, after);
    const row = diff.changes[0]!;
    expect(row).toMatchObject({
      origin: 'https://player.dailymotion.com',
      party: 'third',
      status: 'added',
      transferredDelta: 220_000,
      afterRequests: 2,
    });
    expect(diff.newThirdPartyOrigins).toBe(1);
  });

  it('names the vendor when the list knows the domain', () => {
    expect(diffOrigins(before, after).changes[0]!.vendor).toEqual({
      id: 'dailymotion',
      label: 'Dailymotion',
      category: 'media',
    });
  });

  it('reports an origin it cannot name by hostname, and counts it', () => {
    const unknown = side([{ url: 'https://tags.example-agency.fr/t.js', transferredBytes: 9_000 }]);
    const diff = diffOrigins(side([]), unknown);
    expect(diff.changes[0]!.vendor).toBeNull();
    expect(diff.changes[0]!.origin).toBe('https://tags.example-agency.fr');
    expect(diff.unidentifiedThirdPartyOrigins).toBe(1);
  });
});

describe('identifyVendor', () => {
  it('matches a hostname exactly or on a dot boundary', () => {
    expect(identifyVendor('googletagmanager.com')?.id).toBe('google-tag-manager');
    expect(identifyVendor('www.googletagmanager.com')?.id).toBe('google-tag-manager');
  });

  it('does not match a lookalike host', () => {
    expect(identifyVendor('notgoogletagmanager.com')).toBeNull();
    expect(identifyVendor('googletagmanager.com.evil.fr')).toBeNull();
  });
});
