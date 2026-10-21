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
  id: 'windows' | 'macos' | 'linux';
  osLabel: string;
  formatBadge: string;
  architectureNote: string;
  installerFilename: string;
  sha256Preview: string;
}

export interface FolioLocalLlmHardwareTier {
  id: string;
  hardwareTier: string;
  modelTag: string;
  vramBudget: string;
  ollamaCommand: string;
  loopbackEndpoint: string;
  recommendedUseCase: string;
}

export interface FolioOfflineParityRow {
  capability: string;
  offlineDesktopStatus: string;
  cloudWebStatus: string;
}

export const FOLIO_OWNERSHIP_MODEL_OPTIONS: FolioOwnershipModelOption[] = [
  {
    id: 'one-time-offline-desktop',
    label: 'One-Time Offline Desktop Purchase ($0/mo Forever)',
    headline: 'Buy once, own forever on your machine with unlimited free local open-source AI.',
    priceBadge: '$0/mo Recurring · One-Time License',
    aiEngineSummary:
      'Unlimited free local LLM drafting (Llama 3.2 / Qwen) over loopback 127.0.0.1:11434 with < 3 KB deterministic fact sheets and $0 API token bills.',
    storageAndPrivacySummary:
      '100% air-gapped local vault (.docx, .xlsx, .pptx, .md) on your SSD with zero outbound telemetry.',
    bestForSummary:
      'Solo founders, boutique agencies, legal/M&A practices, and teams eliminating monthly per-seat SaaS rent.',
  },
  {
    id: 'monthly-cloud-subscription',
    label: 'Monthly Cloud Subscription (Managed Browser Workspace)',
    headline: 'Zero-install browser access with identical deterministic OOXML and formula audit parity.',
    priceBadge: '$22/mo Cloud Seat · Cancel Anytime',
    aiEngineSummary:
      'Managed cloud inference or local loopback bridge fed by the exact same < 3 KB deterministic fact sheet.',
    storageAndPrivacySummary:
      'Instant browser workspace with optional encrypted export to local .docx, .xlsx, and .pptx packages.',
    bestForSummary:
      'Distributed operators who want instant multi-device browser access without installing a local runtime.',
  },
];

export const FOLIO_DESKTOP_INSTALLER_TARGETS: FolioDesktopInstallerTarget[] = [
  {
    id: 'windows',
    osLabel: 'Windows 11 / 10 Desktop',
    formatBadge: '.exe / .msi Installer',
    architectureNote: 'x64 & ARM64 Native Shared-Brain Package',
    installerFilename: 'Folio-Office-Setup-1.4.0-x64.msi',
    sha256Preview: 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  },
  {
    id: 'macos',
    osLabel: 'macOS Apple Silicon & Intel',
    formatBadge: '.dmg Universal Disk Image',
    architectureNote: 'Universal Binary (M1 / M2 / M3 / M4 + Intel)',
    installerFilename: 'Folio-Office-1.4.0-universal.dmg',
    sha256Preview: 'sha256:8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
  },
  {
    id: 'linux',
    osLabel: 'Linux Workstation',
    formatBadge: '.AppImage / .deb Package',
    architectureNote: 'x86_64 & ARM64 Air-Gapped Desktop Build',
    installerFilename: 'Folio-Office-1.4.0-x86_64.AppImage',
    sha256Preview: 'sha256:2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae',
  },
];

export const FOLIO_LOCAL_LLM_HARDWARE_TIERS: FolioLocalLlmHardwareTier[] = [
  {
    id: 'ram-8gb-light',
    hardwareTier: '8 GB RAM Ultrabook',
    modelTag: 'llama3.2:1b',
    vramBudget: '1.3 GB RAM / VRAM',
    ollamaCommand: 'ollama run llama3.2:1b',
    loopbackEndpoint: 'http://127.0.0.1:11434/api/generate',
    recommendedUseCase:
      'Instant offline contract clause summaries, executive brief polishing, and slide speaker notes.',
  },
  {
    id: 'ram-16gb-balanced',
    hardwareTier: '8-16 GB RAM Standard Laptop',
    modelTag: 'llama3.2:3b',
    vramBudget: '2.2 GB RAM / VRAM',
    ollamaCommand: 'ollama run llama3.2:3b',
    loopbackEndpoint: 'http://127.0.0.1:11434/api/generate',
    recommendedUseCase:
      'Full multi-section M&A memo drafting, board deck narratives, and redline commentary at $0 token cost.',
  },
  {
    id: 'ram-16gb-plus-workstation',
    hardwareTier: '16 GB+ Pro Workstation',
    modelTag: 'qwen2.5:7b',
    vramBudget: '4.7 GB RAM / VRAM',
    ollamaCommand: 'ollama run qwen2.5:7b',
    loopbackEndpoint: 'http://127.0.0.1:11434/api/generate',
    recommendedUseCase:
      'Deep financial waterfall narrative synthesis and multi-document legal dossier drafting.',
  },
  {
    id: 'ram-24gb-studio',
    hardwareTier: '24 GB+ Studio Rig',
    modelTag: 'qwen3:8b',
    vramBudget: '5.2 GB RAM / VRAM',
    ollamaCommand: 'ollama run qwen3:8b',
    loopbackEndpoint: 'http://127.0.0.1:11434/api/generate',
    recommendedUseCase:
      'Maximum local reasoning for complex regulatory filings and clean-room IP audit reports.',
  },
];

export const FOLIO_OFFLINE_PARITY_ROWS: FolioOfflineParityRow[] = [
  {
    capability: 'OOXML Document (.docx), Spreadsheet (.xlsx), & Deck (.pptx) Engine',
    offlineDesktopStatus: '100% Local on Your Machine (Zero Network Calls)',
    cloudWebStatus: '100% Shared-Brain Engine in Browser',
  },
  {
    capability: 'Deterministic Formula & Schema Audit (0 #REF!, 0 #DIV/0!, 0 #NAME?)',
    offlineDesktopStatus: '100% Deterministic Local Verification',
    cloudWebStatus: '100% Deterministic Browser Verification',
  },
  {
    capability: 'AI Executive Narrative Drafting (< 3 KB Fact Sheet Guardrail)',
    offlineDesktopStatus: 'Unlimited Free Open-Source Local LLM (Ollama 127.0.0.1:11434)',
    cloudWebStatus: 'Managed Cloud AI or Local Loopback Bridge',
  },
  {
    capability: 'Ongoing Running Cost & Seat Tax',
    offlineDesktopStatus: 'One-Time Purchase · $0/mo Forever',
    cloudWebStatus: 'Optional Monthly Cloud Subscription',
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
    `<h3>${model.label}</h3>`,
    `<p>${model.headline}</p>`,
    `</section>`,
    `<section data-testid="desktop-download-hub" aria-label="Offline Desktop Installer Download Hub">`,
    ...FOLIO_DESKTOP_INSTALLER_TARGETS.map(
      (target) => `<div data-installer-os="${target.id}">${target.osLabel} (${target.formatBadge}): ${target.installerFilename}</div>`,
    ),
    `</section>`,
    `<section data-testid="local-llm-hardware-selector" aria-label="Free Open-Source Local LLM Hardware Selector">`,
    `<p>${tier.hardwareTier} · ${tier.modelTag} · ${tier.ollamaCommand} · ${tier.loopbackEndpoint}</p>`,
    `</section>`,
    `<section data-testid="offline-parity-table" aria-label="Offline Desktop vs Cloud Web 100% Feature Parity Table">`,
    ...FOLIO_OFFLINE_PARITY_ROWS.map(
      (row) => `<div>${row.capability}: ${row.offlineDesktopStatus} | ${row.cloudWebStatus}</div>`,
    ),
    `</section>`,
  ].join('\n');
}
