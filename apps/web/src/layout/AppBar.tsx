import { Disclosure } from '@balise/ui';
import { fill, t } from '../i18n';
import { canon } from '../fixtures/canon';
import { fieldList, serviceEnvironment } from '../lib/fingerprint-view';
import { reviewCountdown } from '../lib/declaration-view';

// row 2 is a credibility feature, not debug output. the full environment
// fingerprint stays visible at all times; it answers "how do i know this is
// comparable?".
export function AppBar() {
  const { service, appBar } = canon;
  // the review falls a year after the version in force, and the countdown is
  // measured from the last thing in the register. the bar used to state a
  // typed "47 d" to a date nothing held.
  const review = reviewCountdown();
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
        <span
          style={{ marginLeft: 'auto' }}
          className={review.due ? 'deadline-pill is-due' : 'deadline-pill'}
        >
          {fill(t.appBar.declarationDue, { days: review.days })}
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
          <Disclosure
            className="mono"
            style={{ color: 'var(--caution)' }}
            content={fill(t.fingerprint.variesNote, {
              fields: fieldList(environment.varying),
              count: environment.scenarioCount,
            })}
          >
            {fieldList(environment.varying)} {t.fingerprint.variesLabel}
          </Disclosure>
        )}
        <a href="#methodology" style={{ marginLeft: 'auto' }}>
          {t.appBar.methodology} {appBar.methodologyVersion}
        </a>
      </div>
    </header>
  );
}
