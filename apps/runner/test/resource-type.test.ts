import { describe, expect, it } from 'vitest';
import { ResourceType } from '@balise/schemas';
import { resourceTypeOf } from '../src/resource-type.js';

describe('resourceTypeOf', () => {
  it('maps the six types the inventory groups by', () => {
    expect(resourceTypeOf('document')).toBe('document');
    expect(resourceTypeOf('script')).toBe('script');
    expect(resourceTypeOf('stylesheet')).toBe('stylesheet');
    expect(resourceTypeOf('image')).toBe('image');
    expect(resourceTypeOf('font')).toBe('font');
    expect(resourceTypeOf('media')).toBe('media');
  });

  it('puts everything else in other rather than inventing a category', () => {
    for (const reported of ['xhr', 'fetch', 'websocket', 'manifest', 'texttrack', 'ping', 'other']) {
      expect(resourceTypeOf(reported)).toBe('other');
    }
  });

  it('never produces a value outside the schema', () => {
    for (const reported of ['document', 'preflight', '', 'SCRIPT']) {
      expect(() => ResourceType.parse(resourceTypeOf(reported))).not.toThrow();
    }
  });
});
