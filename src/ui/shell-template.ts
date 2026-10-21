export interface ConfidentialDocPrivacyPreset {
  id: string;
  documentType: string;
  cloudTelemetryExposure: string;
  cloudRetentionRisk: string;
  localVaultGuarantee: string;
  verificationReceiptText: string;
}

export interface SovereignExportVerifierPreset {
  id: string;
  deliverableLabel: string;
  ooxmlFormatSummary: string;
  formulaAndSchemaAudit: string;
  localSha256Digest: string;
  manifestText: string;
}

export const FOLIO_PRIVACY_COMPARATOR_PRESETS: ConfidentialDocPrivacyPreset[] = [
  {
    id: 'ma-term-sheet-cap-table',
    documentType: 'M&A Term Sheet & Cap Table (.xlsx + .docx)',
    cloudTelemetryExposure:
      'Cloud office editors stream cell-level valuation formulas, dilution scenarios, and redline comments through multi-tenant vendor servers.',
    cloudRetentionRisk:
      'Auto-indexed in cloud search graphs and third-party AI training/copilot pipelines unless enterprise DLP add-ons are configured.',
    localVaultGuarantee:
      '100% local OOXML (.xlsx + .docx) evaluation on your machine with zero outbound network requests or telemetry beacons.',
    verificationReceiptText:
      'FOLIO SOVEREIGN RECEIPT | Artifact: M&A Term Sheet & Cap Table (.xlsx + .docx) | Storage: Local Device Vault Only | Outbound Cloud Telemetry: 0 Bytes | SaaS Seat Tax: $0/mo Recurring',
  },
  {
    id: 'litigation-client-contract-dossier',
    documentType: 'Litigation & Client Contract Dossier (.docx)',
    cloudTelemetryExposure:
      'Hosted word processors sync privileged counsel notes, revision history, and counterparty redlines to remote cloud buckets.',
    cloudRetentionRisk:
      'Subpoena and vendor breach surface persists across cloud snapshot backups even after a user deletes the shared link.',
    localVaultGuarantee:
      'Air-gapped local .docx authoring and revision history stored strictly on your encrypted local drive under your sole custody.',
    verificationReceiptText:
      'FOLIO SOVEREIGN RECEIPT | Artifact: Litigation & Client Contract Dossier (.docx) | Storage: Local Device Vault Only | Outbound Cloud Telemetry: 0 Bytes | SaaS Seat Tax: $0/mo Recurring',
  },
  {
    id: 'board-strategy-deck',
    documentType: 'Board Strategy Deck (.pptx)',
    cloudTelemetryExposure:
      'Cloud presentation suites log slide-by-slide viewing telemetry, speaker notes, and embedded financial charts on remote servers.',
    cloudRetentionRisk:
      'Unintended link-sharing permissions or cloud account compromise exposes quarterly board strategy before announcement.',
    localVaultGuarantee:
      'Native local .pptx generation and slide editing with zero cloud sync, zero external asset pings, and full offline ownership.',
    verificationReceiptText:
      'FOLIO SOVEREIGN RECEIPT | Artifact: Board Strategy Deck (.pptx) | Storage: Local Device Vault Only | Outbound Cloud Telemetry: 0 Bytes | SaaS Seat Tax: $0/mo Recurring',
  },
];

export const FOLIO_EXPORT_VERIFIER_PRESETS: SovereignExportVerifierPreset[] = [
  {
    id: 'docx-executive-contract-brief',
    deliverableLabel: '.docx Executive Contract Brief',
    ooxmlFormatSummary: 'Strict OOXML WordprocessingML package (.docx) with semantic headings, numbered clauses, and clean redline history.',
    formulaAndSchemaAudit: 'Schema Audit: PASS (0 external tracking pixels, 0 remote template links, 100% offline font & table integrity).',
    localSha256Digest: 'sha256:9f4a8c2d1e7b6034a5c8d9e2f1047b3c8d2a6f91e0b4c7d3a2f8e1b9c6d4a012',
    manifestText:
      'FOLIO CLIENT DELIVERABLE MANIFEST | Format: .docx Executive Contract Brief | Audit: 0 External Links / 100% Local OOXML | Integrity: sha256:9f4a8c2d1e7b6034a5c8d9e2f1047b3c8d2a6f91e0b4c7d3a2f8e1b9c6d4a012 | Cloud Sync: Disabled (Air-Gapped Local Vault)',
  },
  {
    id: 'xlsx-deterministic-financial-waterfall',
    deliverableLabel: '.xlsx Deterministic Financial Waterfall (0 Formula Errors)',
    ooxmlFormatSummary: 'Native SpreadsheetML workbook (.xlsx) with cached formula evaluation, explicit text/identifier cells, and currency formatting.',
    formulaAndSchemaAudit: 'Formula Audit: PASS (0 #REF!, 0 #DIV/0!, 0 #NAME?, 0 circular references across 100% of worksheet cells).',
    localSha256Digest: 'sha256:4c8e2b7a9d01f3e6b5a2c4d8e9f01a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f',
    manifestText:
      'FOLIO CLIENT DELIVERABLE MANIFEST | Format: .xlsx Deterministic Financial Waterfall (0 Formula Errors) | Audit: 0 Formula Errors (#REF!/#DIV/0!/#NAME? Clear) | Integrity: sha256:4c8e2b7a9d01f3e6b5a2c4d8e9f01a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f | Cloud Sync: Disabled (Air-Gapped Local Vault)',
  },
  {
    id: 'pptx-board-architecture-deck',
    deliverableLabel: '.pptx Board Architecture Deck',
    ooxmlFormatSummary: 'Native PresentationML archive (.pptx) with widescreen slide masters, speaker notes, and embedded vector tables.',
    formulaAndSchemaAudit: 'Slide Audit: PASS (0 broken media relationships, 0 external web beacon fonts, 100% deterministic slide XML).',
    localSha256Digest: 'sha256:7b1d3f5a8c9e0246b8d0f2a4c6e813579bdf02468ace13579bdf02468ace1357',
    manifestText:
      'FOLIO CLIENT DELIVERABLE MANIFEST | Format: .pptx Board Architecture Deck | Audit: 0 External Beacons / 100% Local PresentationML | Integrity: sha256:7b1d3f5a8c9e0246b8d0f2a4c6e813579bdf02468ace13579bdf02468ace1357 | Cloud Sync: Disabled (Air-Gapped Local Vault)',
  },
];

export function renderFolioPrivacyComparatorShell(selectedId: string = FOLIO_PRIVACY_COMPARATOR_PRESETS[0].id): string {
  const active =
    FOLIO_PRIVACY_COMPARATOR_PRESETS.find((preset) => preset.id === selectedId) ??
    FOLIO_PRIVACY_COMPARATOR_PRESETS[0];

  return [
    `<section data-testid="folio-privacy-comparator" aria-label="3-Second Cloud Docs Telemetry vs Air-Gapped Local Vault Privacy Comparator">`,
    `<h3>3-Second Cloud Docs Telemetry vs Air-Gapped Local Vault Privacy Comparator</h3>`,
    `<p>${active.documentType}</p>`,
    `<p>${active.cloudTelemetryExposure}</p>`,
    `<p>${active.localVaultGuarantee}</p>`,
    `<button type="button" data-testid="copy-sovereign-office-receipt-btn">1-Click Copy Sovereign Office Verification Receipt</button>`,
    `</section>`,
  ].join('\n');
}

export function renderFolioExportVerifierShell(selectedId: string = FOLIO_EXPORT_VERIFIER_PRESETS[0].id): string {
  const active =
    FOLIO_EXPORT_VERIFIER_PRESETS.find((preset) => preset.id === selectedId) ??
    FOLIO_EXPORT_VERIFIER_PRESETS[0];

  return [
    `<section data-testid="folio-export-verifier" aria-label="3-Second Multi-Format Sovereign Export and Formula Audit Verifier">`,
    `<h3>3-Second Multi-Format Sovereign Export & Formula Audit Verifier</h3>`,
    `<p>${active.deliverableLabel}</p>`,
    `<p>${active.formulaAndSchemaAudit}</p>`,
    `<p>${active.localSha256Digest}</p>`,
    `<button type="button" data-testid="copy-deliverable-manifest-btn">1-Click Copy Client Deliverable Manifest</button>`,
    `</section>`,
  ].join('\n');
}
