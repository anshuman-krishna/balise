import { useSearchParams } from 'react-router';

/**
 * a tab selection held in the url rather than in component state.
 *
 * two reasons. a run's resources or a check's raw markdown is a thing someone
 * links to, and a tab that is only reachable by clicking is a tab no static
 * audit can render, so the keyboard audit would cover the first panel of a
 * screen and none of the others.
 *
 * an unknown or absent value falls back rather than failing: a stale link
 * opens the screen instead of an error.
 */
export function useTabParam<K extends string>(
  param: string,
  keys: readonly K[],
  fallback: K,
): [K, (key: K) => void] {
  const [params, setParams] = useSearchParams();
  const raw = params.get(param);
  const selected = keys.includes(raw as K) ? (raw as K) : fallback;

  function select(key: K) {
    const next = new URLSearchParams(params);
    if (key === fallback) next.delete(param);
    else next.set(param, key);
    // replace, so arrowing across five tabs does not put five entries in the
    // back button.
    setParams(next, { replace: true });
  }

  return [selected, select];
}

/** the tab in a url, or the fallback. exported so an audit can name it. */
export function tabParamValue<K extends string>(
  search: string,
  param: string,
  keys: readonly K[],
  fallback: K,
): K {
  const raw = new URLSearchParams(search).get(param);
  return keys.includes(raw as K) ? (raw as K) : fallback;
}
