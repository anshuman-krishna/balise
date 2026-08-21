import { fill, t } from '../i18n';
import { canon } from '../fixtures/canon';
import { fieldList, serviceEnvironment } from '../lib/fingerprint-view';

// row 2 is a credibility feature, not debug output. the full environment
// fingerprint stays visible at all times; it answers "how do i know this is
// comparable?".
export function AppBar() {
  const { service, appBar } = canon;
  // the service's scenarios are not all one environment: continuous monitoring
  // runs without coverage instrumentation, the pull request scenario runs with
  // it. the bar states what they share and names what they do not, because a
  // single line claiming one fingerprint for the service would be claiming a
  // comparability that does not hold across it.
  const environment = serviceEnvironment();
  return (
    <header className="app-bar">
      <div className="app-bar-row1">
        <button type="button" className="service-switcher">
          <span className="mono" style={{ fontSize: 11.5 }}>
            {service.domain}
          </span>
          <span style={{ fontSize: 9, color: 'var(--text-secondary)', maxWidth: 130 }}>
            {service.organisation}
          </span>
          <span aria-hidden="true" style={{ fontSize: 8, color: 'var(--text-secondary)' }}>
            ▾
          </span>
        </button>
        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
          {t.appBar.branch}{' '}
          <span className="mono" style={{ color: 'var(--ink)', fontSize: 10.5 }}>
            {service.branch}
          </span>
        </span>
        <span style={{ marginLeft: 'auto' }} className="deadline-pill">
          {fill(t.appBar.declarationDue, { days: appBar.deadlineDays })}
        </span>
        <span className="mono" style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
          {t.appBar.lastRun} {appBar.lastRunTime} ·{' '}
          {fill(t.appBar.minutesAgo, { minutes: appBar.lastRunMinutesAgo })}
        </span>
        <span className="avatar">{appBar.userInitials}</span>
      </div>
      <div className="app-bar-row2">
        <span className="label">{t.appBar.fingerprintLabel}</span>
        <span>
          {environment.rows.map((row, index) => (
            <span key={row.key}>
              {index === 0 ? null : ' · '}
              {row.key} {row.value}
            </span>
          ))}
        </span>
        {environment.uniform ? null : (
          <span
            className="mono"
            style={{ color: 'var(--caution)' }}
            title={fill(t.fingerprint.variesNote, {
              fields: fieldList(environment.varying),
              count: environment.scenarioCount,
            })}
          >
            {fieldList(environment.varying)} {t.fingerprint.variesLabel}
          </span>
        )}
        <a href="#methodology" style={{ marginLeft: 'auto' }}>
          {t.appBar.methodology} {appBar.methodologyVersion}
        </a>
      </div>
    </header>
  );
}
