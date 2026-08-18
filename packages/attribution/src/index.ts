export { decodeVlqSegment, decodeMappings, type MappingSegment, type DecodedMappings } from './vlq.js';
export { parseSourceMap, applySourceRoot, type ParsedSourceMap, type SourceMapResult } from './source-map.js';
export { attributeBundle, utf8Length, utf8LengthRange, type BundleInput } from './bundle.js';
export {
  normaliseSourcePath,
  packageNameOf,
  changeStatus,
  diffModules,
  type NormalisedSource,
} from './modules.js';
export {
  classifyUrl,
  diffResources,
  diffOrigins,
  type ResourceSideInput,
  type UrlOrigin,
} from './resources.js';
export { VENDORS, identifyVendor } from './vendors.js';
export { attribute, reconcile, type AttributionSide } from './report.js';
export {
  blameModules,
  isRepositoryPath,
  type GitPort,
  type GitLookup,
  type GitRange,
} from './blame.js';
