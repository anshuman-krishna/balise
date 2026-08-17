import type { MetricSet, MetricValue, RawCapture } from '@balise/schemas';
import { METRIC_UNIT } from '@balise/schemas';

function originOf(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

/**
 * Pure extraction from a raw capture to a metric set. No IO, no rounding:
 * stored values are raw, display precision is applied at the edge
 * (invariant 6).
 *
 * dom_node_count is the count at network idle, the stricter of the two
 * captured counts. Both stay available on the capture.
 */
export function extractMetrics(capture: RawCapture): MetricSet {
  const serviceOrigin = originOf(capture.serviceOrigin);
  if (serviceOrigin === null) {
    throw new Error(`serviceOrigin is not a valid URL: ${capture.serviceOrigin}`);
  }

  let totalBytes = 0;
  let thirdPartyBytes = 0;
  for (const resource of capture.resources) {
    totalBytes += resource.transferredBytes;
    const origin = originOf(resource.url);
    // Unparsable URLs and opaque origins (data:, about:, blob:) have no
    // network host of their own; they count as first party rather than
    // being guessed at. An opaque origin serializes to the string "null".
    if (origin !== null && origin !== 'null' && origin !== serviceOrigin) {
      thirdPartyBytes += resource.transferredBytes;
    }
  }

  const thirdPartySharePct = totalBytes > 0 ? (thirdPartyBytes / totalBytes) * 100 : 0;

  const values: MetricValue[] = [
    { metricId: 'transferred_bytes', value: totalBytes, unit: METRIC_UNIT.transferred_bytes },
    { metricId: 'request_count', value: capture.requestCount, unit: METRIC_UNIT.request_count },
    {
      metricId: 'dom_node_count',
      value: capture.domNodeCountAtNetworkIdle,
      unit: METRIC_UNIT.dom_node_count,
    },
    { metricId: 'js_execution_ms', value: capture.jsExecutionMs, unit: METRIC_UNIT.js_execution_ms },
    { metricId: 'third_party_bytes', value: thirdPartyBytes, unit: METRIC_UNIT.third_party_bytes },
    {
      metricId: 'third_party_share_pct',
      value: thirdPartySharePct,
      unit: METRIC_UNIT.third_party_share_pct,
    },
  ];

  return { pass: capture.pass, values };
}
