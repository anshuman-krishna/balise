import { RulePack } from '@balise/schemas';

/**
 * validates a pack and refuses one that is internally inconsistent. a pack is
 * the definition of what conformity means, so a duplicate id or a criterion
 * in a family the pack does not declare is a defect to reject, not to work
 * around.
 */
export function parsePack(input: unknown): RulePack {
  const pack = RulePack.parse(input);

  const seen = new Set<string>();
  for (const criterion of pack.criteria) {
    if (seen.has(criterion.id)) {
      throw new Error(`pack ${pack.id}@${pack.version} declares criterion ${criterion.id} twice`);
    }
    seen.add(criterion.id);
  }

  const families = new Set(pack.families.map((family) => family.id));
  for (const criterion of pack.criteria) {
    if (!families.has(criterion.family)) {
      throw new Error(
        `criterion ${criterion.id} is in family "${criterion.family}", which pack ${pack.id}@${pack.version} does not declare`,
      );
    }
  }

  return pack;
}

/**
 * selects an exact version. there is no "latest": an assessment is bound to
 * the version it was made under, forever, and a caller that does not say
 * which version it wants has a bug.
 */
export function selectPack(packs: readonly RulePack[], id: string, version: string): RulePack {
  const pack = packs.find((candidate) => candidate.id === id && candidate.version === version);
  if (pack === undefined) {
    const available = packs.map((candidate) => `${candidate.id}@${candidate.version}`).join(', ');
    throw new Error(`no pack ${id}@${version}. available: ${available || 'none'}`);
  }
  return pack;
}
