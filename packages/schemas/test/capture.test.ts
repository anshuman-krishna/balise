import { describe, expect, it } from 'vitest';
import { CapturedResource, RawCapture, ResourceType } from '../src/capture.js';

function resource(overrides: Record<string, unknown> = {}) {
  return {
    url: 'https://sevre-et-loire.fr/assets/app.js',
    resourceType: 'script',
    transferredBytes: 122_000,
    decodedBytes: 402_000,
    unusedDecodedBytes: 176_000,
    startMs: 264,
    durationMs: 420,
    ...overrides,
  };
}

describe('CapturedResource', () => {
  it('accepts a fully recorded response', () => {
    expect(() => CapturedResource.parse(resource())).not.toThrow();
  });

  it('accepts every field the browser could refuse, as null', () => {
    expect(() =>
      CapturedResource.parse(
        resource({ decodedBytes: null, unusedDecodedBytes: null, startMs: null, durationMs: null }),
      ),
    ).not.toThrow();
  });

  it('refuses unused bytes larger than the body they are a share of', () => {
    expect(() => CapturedResource.parse(resource({ unusedDecodedBytes: 500_000 }))).toThrow();
  });

  it('refuses coverage on a body it does not have', () => {
    // an unused figure with no decoded size is a share of nothing.
    expect(() => CapturedResource.parse(resource({ decodedBytes: null }))).toThrow();
  });

  it('refuses a negative duration', () => {
    expect(() => CapturedResource.parse(resource({ durationMs: -1 }))).toThrow();
  });

  it('holds the seven types the inventory groups by, and no eighth', () => {
    expect(ResourceType.options).toEqual([
      'document',
      'script',
      'stylesheet',
      'image',
      'font',
      'media',
      'other',
    ]);
    expect(() => CapturedResource.parse(resource({ resourceType: 'xhr' }))).toThrow();
  });
});

describe('RawCapture', () => {
  it('allows more requests than resource records', () => {
    // redirects and aborted requests are counted and carry no record.
    expect(() =>
      RawCapture.parse({
        serviceOrigin: 'https://sevre-et-loire.fr',
        pass: 'cold',
        resources: [resource()],
        requestCount: 4,
        domNodeCountAtLoad: 2_040,
        domNodeCountAtNetworkIdle: 2_118,
        jsExecutionMs: 548,
      }),
    ).not.toThrow();
  });
});
