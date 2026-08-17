import { fill, t } from '../i18n';
import { canon } from '../fixtures/canon';

// Row 2 is a credibility feature, not debug output. The full environment
// fingerprint stays visible at all times; it answers "how do I know this is
// comparable?".
export function AppBar() {
  const { service, appBar } = canon;
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
        <span>{appBar.fingerprint}</span>
        <a href="#methodology" style={{ marginLeft: 'auto' }}>
          {t.appBar.methodology} {appBar.methodologyVersion}
        </a>
      </div>
    </header>
  );
}
