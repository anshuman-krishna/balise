/** a complete balise.yml, exercising every form the reader accepts. */
export const CANON_YAML = `# balise.yml · sevre-et-loire.fr · pack rgesn-2024-v2
version: 1
service: portail-metropolitain
runs: 5
profiles: [desktop-fibre, mobile-4g]
reference_model: swd@4.0
# deltas below the computed noise floor are never failures
noise_floor: auto

budgets:
  - scope: /accueil
    bytes: { warn: 860KB, fail: 900KB }
  - scope: /demarches/*
    bytes: { warn: 1250KB, fail: 1300KB }
    requests: { fail: 90 }
  - scope: journey:demande-acte
    bytes: { fail: 1400KB }
  - scope: service
    third_party_share: { fail: 30% }
    relative_to_baseline: { warn: +3% }

check:
  block_merge_on: fail
  annotate_files: true
`;
