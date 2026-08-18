import type { ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router';
import { fill, t } from '../i18n';
import { ledgerFixture, type LedgerRecord } from '../fixtures/canon';
import { PublicHeader } from '../components/PublicHeader';
import { lookupLedgerRecord } from '../lib/ledger-lookup';

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

function Record({ record }: { record: LedgerRecord }) {
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
          {t.ledger.checkedNow}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', marginTop: 2 }}>
        <Row label={keys.hash}>{record.hash}</Row>
        <Row label={keys.type}>{record.type}</Row>
        <Row label={keys.recordedAt}>{record.recordedAt}</Row>
        <Row label={keys.service}>{record.service}</Row>
        <Row label={keys.methodology}>
          {record.methodology} · <a href="#methodology">{record.methodologyUrl}</a>
        </Row>
        <Row label={keys.models}>{record.models}</Row>
        <Row label={keys.fingerprint}>{record.fingerprint}</Row>
        <Row label={keys.position}>{record.position}</Row>
        <Row label={keys.merkle}>{record.merkle}</Row>
      </div>

      {/* invariant 4 stated to the reader: the chain is append only */}
      <div className="card-dark" style={{ marginTop: 26, padding: '15px 17px' }}>
        <p style={{ margin: 0, fontSize: 11, lineHeight: 1.75, color: 'var(--on-dark-text)' }}>
          {t.ledger.appendOnly}
        </p>
      </div>

      <p style={{ margin: '22px 0 0', fontSize: 11, lineHeight: 1.7, color: 'var(--text-secondary)' }}>
        {fill(t.ledger.recordedValues, {
          transferred: record.values.transferredKb,
          mad: record.values.madKb,
          requests: record.values.requests,
          dom: record.values.domNodes,
          carbon: record.values.carbon,
          model: record.values.model,
          low: record.values.low,
          high: record.values.high,
        })}
      </p>
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
  const lookup = lookupLedgerRecord(params.hash, ledgerFixture.records);
  const shown = lookup.status === 'found' ? lookup.record.shortHash : lookup.query;

  return (
    <div className="screen-public">
      <PublicHeader path={fill(t.ledger.chrome, { hash: shown })} />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '44px 26px 70px' }}>
        {lookup.status === 'found' ? (
          <Record record={lookup.record} />
        ) : (
          <NotFound
            query={lookup.query}
            onKnown={() => navigate(`/v/${ledgerFixture.records[0]?.shortHash ?? ''}`)}
          />
        )}
      </div>
    </div>
  );
}
