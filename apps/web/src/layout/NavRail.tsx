import { NavLink } from 'react-router';
import { t } from '../i18n';
import { canon } from '../fixtures/canon';
import { Wordmark } from '../components/Wordmark';

interface NavEntry {
  to: string;
  label: string;
}

function Group({ label, entries }: { label: string; entries: NavEntry[] }) {
  return (
    <div className="nav-group">
      <div className="nav-group-label">{label}</div>
      {entries.map((entry) => (
        <NavLink
          key={entry.to}
          to={entry.to}
          className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
        >
          {entry.label}
        </NavLink>
      ))}
    </div>
  );
}

// the four groups are the information architecture: measurement, gating,
// paperwork, public accountability. preserved even as items are added.
export function NavRail() {
  const nav = t.nav;
  return (
    <nav className="nav-rail" aria-label="Balise">
      <div className="nav-brand">
        <Wordmark />
        <span className="nav-brand-name">BALISE</span>
      </div>
      <div className="nav-version">v0.1.0 · fr-sovereign</div>

      <Group
        label={nav.groups.instrument}
        entries={[
          { to: '/', label: nav.items.dashboard },
          { to: '/runs', label: nav.items.runDetail },
          { to: '/comparison', label: nav.items.comparison },
          { to: '/budgets', label: nav.items.budgets },
          { to: '/criteria', label: nav.items.criteria },
          { to: '/declaration', label: nav.items.declarationEditor },
          { to: '/tender', label: nav.items.tenderWorkspace },
          { to: '/contract', label: nav.items.contractTracker },
          { to: '/fleet', label: nav.items.fleet },
        ]}
      />
      <Group label={nav.groups.check} entries={[{ to: '/pr-check', label: nav.items.prCheck }]} />
      <Group
        label={nav.groups.documents}
        entries={[
          { to: '/documents/declaration', label: nav.items.docDeclaration },
          { to: '/documents/annexe', label: nav.items.docAnnexe },
          { to: '/documents/rapport', label: nav.items.docRapport },
        ]}
      />
      <Group
        label={nav.groups.publicSurfaces}
        entries={[
          { to: '/public/scan', label: nav.items.freeScan },
          { to: '/public/observatory', label: nav.items.observatory },
          { to: '/public/ledger', label: nav.items.ledgerVerification },
        ]}
      />

      <div className="nav-tenant">
        {canon.tenant.agency} · {canon.tenant.city}
        <br />
        {canon.tenant.plan} · {canon.tenant.servicesUsed}/{canon.tenant.servicesTotal} services
      </div>
    </nav>
  );
}
