import type { RulePack } from '@balise/schemas';
import { rgesn2024v2 } from './rgesn-2024-v2.js';

export { rgesn2024v2 };

/**
 * every pack this build knows about. a pack is selected by exact id and
 * version; there is no latest, because an assessment stays bound to the
 * version it was made under.
 */
export const packs: readonly RulePack[] = [rgesn2024v2];
