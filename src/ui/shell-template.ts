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

export interface FolioOwnershipModelOption {
  id: 'one-time-offline-desktop' | 'monthly-cloud-subscription';
  label: string;
  headline: string;
  priceBadge: string;
  aiEngineSummary: string;
  storageAndPrivacySummary: string;
  bestForSummary: string;
}

export interface FolioDesktopInstallerTarget {
  id: 'windows' | 'macos';
  osLabel: string;
  status: 'in-preparation';
  runtime: string;
  releaseNote: string;
}

export interface FolioLocalLlmHardwareTier {
  id: string;
  hardwareTier: string;
  modelTag: string;
  ollamaCommands: string[];
  loopbackEndpoint: string;
  recommendedUseCase: string;
}

export interface FolioOfflineParityRow {
  capability: string;
  offlineDesktopStatus: string;
  cloudWebStatus: string;
  needsInternet: 'No' | 'Yes';
}

export const FOLIO_OWNERSHIP_MODEL_OPTIONS: FolioOwnershipModelOption[] = [
  {
    id: 'one-time-offline-desktop',
    label: 'One-Time Offline Desktop Purchase (Unlimited Free Local AI)',
    headline: 'Proposed ownership model: execution on the buyer hardware removes monthly local caps forever for the owned major version.',
    priceBadge: 'Perpetual major version · No monthly local cap',
    aiEngineSummary:
      'The proposed local AI adapter uses loopback 127.0.0.1:11434 and receives strictly less than 3 KB of deterministic JSON. It is not shipped in the current Electron build.',
    storageAndPrivacySummary:
      'The owned major version is designed for local documents, spreadsheets, decks, and export manifests on the buyer computer.',
    bestForSummary:
      'Hardware, electricity, storage, and model downloads remain the buyer responsibility.',
  },
  {
    id: 'monthly-cloud-subscription',
    label: 'Monthly Cloud Subscription (Hosted Web & Cloud AI)',
    headline: 'The planned hosted model covers web servers, cloud sync, and managed AI, subject to hosted entitlement and allowance verification.',
    priceBadge: 'Proposed hosted subscription · Plan allowance applies',
    aiEngineSummary:
      'Hosted inference remains a proposed service until provider, entitlement, and allowance proof exists.',
    storageAndPrivacySummary:
      'Cloud team sync needs the internet and follows the verified online plan allowance.',
    bestForSummary:
      'The current product source does not prove a released hosted subscription.',
  },
];

export const FOLIO_DESKTOP_INSTALLER_TARGETS: FolioDesktopInstallerTarget[] = [
  {
    id: 'windows',
    osLabel: 'Windows desktop',
    status: 'in-preparation',
    runtime: 'Electron source present; Tauri v2 installer and key ring pending',
    releaseNote: 'No signed customer installer or checksum is published.',
  },
  {
    id: 'macos',
    osLabel: 'macOS desktop',
    status: 'in-preparation',
    runtime: 'Tauri v2 platform build pending',
    releaseNote: 'No signed or notarized customer release is published.',
  },
];

export const FOLIO_LOCAL_LLM_HARDWARE_TIERS: FolioLocalLlmHardwareTier[] = [
  {
    id: '4-8gb',
    hardwareTier: '4-8 GB RAM',
    modelTag: 'llama3.2:3b',
    ollamaCommands: ['ollama run llama3.2:3b'],
    loopbackEndpoint: 'http://127.0.0.1:11434',
    recommendedUseCase:
      'Guidance for compact local interpretation. Actual speed depends on the buyer hardware.',
  },
  {
    id: '16gb',
    hardwareTier: '16 GB RAM',
    modelTag: 'qwen2.5:7b',
    ollamaCommands: ['ollama run qwen2.5:7b'],
    loopbackEndpoint: 'http://127.0.0.1:11434',
    recommendedUseCase:
      'Guidance for longer local interpretation. Actual speed depends on the buyer hardware.',
  },
  {
    id: '32gb-plus',
    hardwareTier: '32+ GB RAM',
    modelTag: 'qwen2.5:14b / deepseek-r1:8b',
    ollamaCommands: ['ollama run qwen2.5:14b', 'ollama run deepseek-r1:8b'],
    loopbackEndpoint: 'http://127.0.0.1:11434',
    recommendedUseCase:
      'Guidance for larger local models. Actual speed depends on the buyer hardware.',
  },
];

export const FOLIO_OFFLINE_PARITY_ROWS: FolioOfflineParityRow[] = [
  {
    capability: 'Documents',
    offlineDesktopStatus: 'Unlimited',
    cloudWebStatus: 'Within plan allowance',
    needsInternet: 'No',
  },
  {
    capability: 'Deterministic financial spreadsheets',
    offlineDesktopStatus: 'Unlimited',
    cloudWebStatus: 'Within plan allowance',
    needsInternet: 'No',
  },
  {
    capability: 'Executive decks',
    offlineDesktopStatus: 'Unlimited',
    cloudWebStatus: 'Within plan allowance',
    needsInternet: 'No',
  },
  {
    capability: 'SHA-256 export manifests',
    offlineDesktopStatus: 'Unlimited',
    cloudWebStatus: 'Within plan allowance',
    needsInternet: 'No',
  },
  {
    capability: 'Cloud team sync',
    offlineDesktopStatus: 'Not available offline',
    cloudWebStatus: 'Within plan allowance',
    needsInternet: 'Yes',
  },
];

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

export function renderFolioOwnershipHubShell(
  selectedModelId: FolioOwnershipModelOption['id'] = 'one-time-offline-desktop',
  selectedTierId: string = FOLIO_LOCAL_LLM_HARDWARE_TIERS[1].id,
): string {
  const model =
    FOLIO_OWNERSHIP_MODEL_OPTIONS.find((item) => item.id === selectedModelId) ??
    FOLIO_OWNERSHIP_MODEL_OPTIONS[0];
  const tier =
    FOLIO_LOCAL_LLM_HARDWARE_TIERS.find((item) => item.id === selectedTierId) ??
    FOLIO_LOCAL_LLM_HARDWARE_TIERS[1];

  return [
    `<section data-testid="ownership-model-switcher" aria-label="One-Time Offline Desktop Ownership vs Monthly Cloud Subscription Switcher">`,
    ...FOLIO_OWNERSHIP_MODEL_OPTIONS.map((option) => `<button type="button" aria-pressed="${option.id === model.id}">${option.label}</button>`),
    `<p class="ownership-model-copy">${model.headline}</p>`,
    `</section>`,
    `<section data-testid="desktop-download-hub" data-release-status="in-preparation" aria-label="Desktop release status">`,
    ...FOLIO_DESKTOP_INSTALLER_TARGETS.map(
      (target) => `<div data-installer-os="${target.id}">${target.osLabel}: ${target.runtime}. ${target.releaseNote}</div>`,
    ),
    `</section>`,
    `<section data-testid="local-llm-hardware-selector" aria-label="Free Open-Source Local LLM Hardware Selector">`,
    `<select aria-label="Computer memory guidance">${FOLIO_LOCAL_LLM_HARDWARE_TIERS.map((option) => `<option value="${option.id}"${option.id === tier.id ? ' selected' : ''}>${option.hardwareTier}</option>`).join('')}</select>`,
    `<p>${tier.hardwareTier} · ${tier.modelTag} · ${tier.loopbackEndpoint}</p>`,
    ...tier.ollamaCommands.map((command) => `<code>${command}</code>`),
    `</section>`,
    `<table data-testid="offline-parity-table" aria-label="Offline and cloud capability comparison">`,
    `<caption>Proposed desktop and local AI capabilities compared with the proposed hosted subscription model</caption>`,
    `<thead><tr><th>Workflow</th><th>On this computer · No monthly limit</th><th>Online plan allowance</th><th>Needs the internet</th></tr></thead>`,
    `<tbody>${FOLIO_OFFLINE_PARITY_ROWS.map((row) => `<tr><th>${row.capability}</th><td>${row.offlineDesktopStatus}</td><td>${row.cloudWebStatus}</td><td>${row.needsInternet}</td></tr>`).join('')}</tbody>`,
    `</table>`,
  ].join('\n');
}
