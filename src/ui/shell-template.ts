export interface ConfidentialDocPrivacyPreset {
  id: string;
  documentType: string;
  cloudTelemetryExposure: string;
  cloudRetentionRisk: string;
  localVaultGuarantee: string;
  verificationReceiptText: string;
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
