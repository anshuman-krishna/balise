import type { ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router';
import { formatInt } from '@balise/ui';
import { fill, t } from '../i18n';
import { canon } from '../fixtures/canon';
import { carbonPage, referenceLabel } from '../lib/carbon-view';
import { ledgerCanon } from '../fixtures/ledger-canon';
import { PublicHeader } from '../components/PublicHeader';
import { lookupLedgerEntry } from '../lib/ledger-lookup';
import { toRecordView, type LedgerRecordView } from '../lib/ledger-view';

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <div
        className="mono"
        style={{ padding: '11px 0', borderBottom: '1px solid var(--divider-cell)', color: 'var(--text-secondary)', fontSize: 11 }}
      >
        {label}
      </div>
      <div
        className="mono"
        style={{ padding: '11px 0', borderBottom: '1px solid var(--divider-cell)', fontSize: 11, wordBreak: 'break-all' }}
      >
        {children}
      </div>
    </>
  );
}

function Record({ view }: { view: LedgerRecordView }) {
  const keys = t.ledger.keys;
  return (
    <>
      <div
        className="mono"
        style={{ fontWeight: 500, fontSize: 9.5, letterSpacing: '.14em', color: 'var(--text-secondary)' }}
      >
        {t.ledger.eyebrow}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 11,
          marginTop: 14,
          paddingBottom: 18,
          borderBottom: '2px solid var(--ink)',
        }}
      >
        <span className="status-mark" style={{ background: 'var(--conforme)', width: 17, height: 17, fontSize: 11 }} aria-hidden="true">
          ✓
        </span>
        <span className="archivo" style={{ fontWeight: 600, fontSize: 19 }}>
          {t.ledger.intact}
        </span>
        <span className="mono" style={{ marginLeft: 'auto', fontSize: 10.5, color: 'var(--text-secondary)' }}>
          {fill(t.ledger.checkedCount, { count: formatInt(ledgerCanon.verification.checkedCount) })}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', marginTop: 2 }}>
        <Row label={keys.hash}>{view.hash}</Row>
        <Row label={keys.type}>{view.type}</Row>
        <Row label={keys.recordedAt}>{view.recordedAt}</Row>
        <Row label={keys.service}>{canon.service.title} · {canon.service.domain}</Row>
        <Row label={keys.methodology}>
          {view.methodology} · <a href="#methodology">balise.fr/methodologie</a>
        </Row>
        {view.models === undefined ? null : <Row label={keys.models}>{view.models}</Row>}
        {view.fingerprint === undefined ? null : <Row label={keys.fingerprint}>{view.fingerprint}</Row>}
        <Row label={keys.position}>
          {fill(t.ledger.positionValue, { position: view.position })}
        </Row>
        <Row label={keys.merkle}>
          {fill(t.ledger.merkleValue, {
            root: `${ledgerCanon.merkleRoot.slice(0, 12)}…`,
            leaves: formatInt(ledgerCanon.entryCount),
          })}
        </Row>
      </div>

      {/* invariant 4 stated to the reader: the chain is append only */}
      <div className="card-dark" style={{ marginTop: 26, padding: '15px 17px' }}>
        <p style={{ margin: 0, fontSize: 11, lineHeight: 1.75, color: 'var(--on-dark-text)' }}>
          {t.ledger.appendOnly}
        </p>
      </div>

      {view.values === undefined ? null : (
        <p style={{ margin: '22px 0 0', fontSize: 11, lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          {fill(t.ledger.recordedValues, {
            transferred: view.values.transferredKb,
            mad: view.values.madKb,
            requests: view.values.requests,
            dom: view.values.domNodes,
            carbon: view.values.carbon,
            model: referenceLabel(carbonPage('candidate')),
            low: view.values.low,
            high: view.values.high,
          })}
        </p>
      )}
    </>
  );
}

// a verification page that guessed would be worth nothing to the buyer
// reading it, so an unknown empreinte says so and offers the one record it
// can prove.
function NotFound({ query, onKnown }: { query: string; onKnown: () => void }) {
  return (
    <>
      <div
        className="mono"
        style={{ fontWeight: 500, fontSize: 9.5, letterSpacing: '.14em', color: 'var(--text-secondary)' }}
      >
        {t.ledger.notFoundEyebrow}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 11,
          marginTop: 14,
          paddingBottom: 18,
          borderBottom: '2px solid var(--ink)',
        }}
      >
        <span className="status-mark" style={{ background: 'var(--breach)', width: 17, height: 17, fontSize: 11 }} aria-hidden="true">
          ✕
        </span>
        <span className="archivo" style={{ fontWeight: 600, fontSize: 19 }}>
          {t.ledger.notFoundTitle}
        </span>
      </div>
      {/* a wider label column: the queried-hash label is two words */}
      <div style={{ display: 'grid', gridTemplateColumns: '190px 1fr', marginTop: 2 }}>
        <Row label={t.ledger.notFoundQueried}>{query}</Row>
      </div>
      <p style={{ margin: '20px 0 0', fontSize: 11.5, lineHeight: 1.7, color: 'var(--text-secondary)', maxWidth: '62ch' }}>
        {t.ledger.notFoundBody}
      </p>
      <button type="button" className="btn-ink" style={{ marginTop: 18 }} onClick={onKnown}>
        {t.ledger.notFoundAction}
      </button>
    </>
  );
}

export function LedgerVerification() {
  const navigate = useNavigate();
  const params = useParams();
  const lookup = lookupLedgerEntry(params.hash, ledgerCanon.entries);
  const shown = lookup.status === 'found' ? lookup.entry.entryHash.slice(0, 8) : lookup.query;

  return (
    <div className="screen-public">
      <PublicHeader path={fill(t.ledger.chrome, { hash: shown })} />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '44px 26px 70px' }}>
        {lookup.status === 'found' ? (
          <Record view={toRecordView(lookup.entry)} />
        ) : (
          <NotFound
            query={lookup.query}
            onKnown={() => navigate(`/v/${ledgerCanon.entries[0]?.entryHash.slice(0, 8) ?? ''}`)}
          />
        )}
      </div>
    </div>
  );
}
