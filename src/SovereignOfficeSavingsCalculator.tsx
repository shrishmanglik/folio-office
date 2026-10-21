import { useState } from 'react';
import {
  ShieldCheck,
  HardDrive,
  Calculator,
  Lock,
  Copy,
  Check,
  FileCheck2,
  Download,
  Cpu,
  Layers,
} from 'lucide-react';
import {
  FOLIO_PRIVACY_COMPARATOR_PRESETS,
  FOLIO_EXPORT_VERIFIER_PRESETS,
  FOLIO_OWNERSHIP_MODEL_OPTIONS,
  FOLIO_DESKTOP_INSTALLER_TARGETS,
  FOLIO_LOCAL_LLM_HARDWARE_TIERS,
  FOLIO_OFFLINE_PARITY_ROWS,
  copySovereignOfficeVerificationReceipt,
  copyClientDeliverableManifest,
  copyLocalOllamaBootstrapCommand,
  type FolioOwnershipModelOption,
} from './app/folio-office-app';

export interface OfficeSeatPreset {
  id: string;
  label: string;
  seats: number;
  cloudPlanDescription: string;
  monthlyCloudRatePerSeatUsd: number;
  fiveYearCloudSpendUsd: number;
  fiveYearFolioSpendUsd: number;
  fiveYearNetSavingsUsd: number;
  sovereigntyNote: string;
}

export const SOVEREIGN_OFFICE_SEAT_PRESETS: OfficeSeatPreset[] = [
  {
    id: 'solo-founder',
    label: '1 Solo Founder',
    seats: 1,
    cloudPlanDescription: '1 seat x $22/mo typical cloud office + AI workspace bundle over 60 months',
    monthlyCloudRatePerSeatUsd: 22,
    fiveYearCloudSpendUsd: 1320,
    fiveYearFolioSpendUsd: 0,
    fiveYearNetSavingsUsd: 1320,
    sovereigntyNote: 'Keep every client contract, financial model, and strategy deck on your own SSD.',
  },
  {
    id: 'five-person-studio',
    label: '5-Person Studio',
    seats: 5,
    cloudPlanDescription: '5 seats x $22/mo typical cloud office + AI workspace bundle over 60 months',
    monthlyCloudRatePerSeatUsd: 22,
    fiveYearCloudSpendUsd: 6600,
    fiveYearFolioSpendUsd: 0,
    fiveYearNetSavingsUsd: 6600,
    sovereigntyNote: 'Zero per-seat SaaS renewals across your entire studio team with instant local file ownership.',
  },
  {
    id: 'fifteen-person-agency',
    label: '15-Person Boutique Agency',
    seats: 15,
    cloudPlanDescription: '15 seats x $22/mo typical cloud office + AI workspace bundle over 60 months',
    monthlyCloudRatePerSeatUsd: 22,
    fiveYearCloudSpendUsd: 19800,
    fiveYearFolioSpendUsd: 0,
    fiveYearNetSavingsUsd: 19800,
    sovereigntyNote: 'Eliminate five-figure recurring cloud seat overhead while keeping client deliverables 100% private.',
  },
];

function formatUsd(amount: number): string {
  return `$${amount.toLocaleString('en-US')}`;
}

export default function SovereignOfficeSavingsCalculator() {
  const [selectedId, setSelectedId] = useState<string>(SOVEREIGN_OFFICE_SEAT_PRESETS[1].id);
  const [selectedDocPresetId, setSelectedDocPresetId] = useState<string>(
    FOLIO_PRIVACY_COMPARATOR_PRESETS[0].id,
  );
  const [copiedDocPresetId, setCopiedDocPresetId] = useState<string | null>(null);

  const [selectedExportPresetId, setSelectedExportPresetId] = useState<string>(
    FOLIO_EXPORT_VERIFIER_PRESETS[0].id,
  );
  const [copiedExportPresetId, setCopiedExportPresetId] = useState<string | null>(null);

  const [selectedOwnershipModelId, setSelectedOwnershipModelId] = useState<
    FolioOwnershipModelOption['id']
  >(FOLIO_OWNERSHIP_MODEL_OPTIONS[0].id);

  const [selectedHardwareTierId, setSelectedHardwareTierId] = useState<string>(
    FOLIO_LOCAL_LLM_HARDWARE_TIERS[1].id,
  );
  const [copiedOllamaTierId, setCopiedOllamaTierId] = useState<string | null>(null);

  const activePreset =
    SOVEREIGN_OFFICE_SEAT_PRESETS.find((preset) => preset.id === selectedId) ??
    SOVEREIGN_OFFICE_SEAT_PRESETS[0];

  const activeDocPreset =
    FOLIO_PRIVACY_COMPARATOR_PRESETS.find((preset) => preset.id === selectedDocPresetId) ??
    FOLIO_PRIVACY_COMPARATOR_PRESETS[0];

  const activeExportPreset =
    FOLIO_EXPORT_VERIFIER_PRESETS.find((preset) => preset.id === selectedExportPresetId) ??
    FOLIO_EXPORT_VERIFIER_PRESETS[0];

  const activeOwnershipModel =
    FOLIO_OWNERSHIP_MODEL_OPTIONS.find((item) => item.id === selectedOwnershipModelId) ??
    FOLIO_OWNERSHIP_MODEL_OPTIONS[0];

  const activeHardwareTier =
    FOLIO_LOCAL_LLM_HARDWARE_TIERS.find((item) => item.id === selectedHardwareTierId) ??
    FOLIO_LOCAL_LLM_HARDWARE_TIERS[1];

  const handleCopyReceipt = async () => {
    await copySovereignOfficeVerificationReceipt(activeDocPreset.id);
    setCopiedDocPresetId(activeDocPreset.id);
  };

  const handleCopyManifest = async () => {
    await copyClientDeliverableManifest(activeExportPreset.id);
    setCopiedExportPresetId(activeExportPreset.id);
  };

  const handleCopyOllamaCommand = async () => {
    await copyLocalOllamaBootstrapCommand(activeHardwareTier.id);
    setCopiedOllamaTierId(activeHardwareTier.id);
  };

  return (
    <section
      className="sovereign-calculator-section"
      data-testid="sovereign-office-savings-calculator"
      aria-label="5-Year SaaS Subscription vs Sovereign Local Office Calculator"
    >
      <div className="sovereign-calculator-header">
        <div>
          <span className="workspace-eyebrow">
            <Calculator size={12} /> 5-YEAR SAAS SUBSCRIPTION VS SOVEREIGN LOCAL OFFICE CALCULATOR
          </span>
          <h2>Stop paying monthly rent for your own documents.</h2>
          <p>
            Compare standard recurring cloud office seat fees against owning your workflow locally with zero subscription lock-in.
          </p>
        </div>
        <div
          className="sovereign-calculator-presets"
          role="tablist"
          aria-label="Team size presets"
        >
          {SOVEREIGN_OFFICE_SEAT_PRESETS.map((preset) => {
            const selected = preset.id === activePreset.id;
            return (
              <button
                key={preset.id}
                type="button"
                role="tab"
                aria-selected={selected}
                data-testid={`sovereign-preset-${preset.id}`}
                className={selected ? 'selected' : ''}
                onClick={() => setSelectedId(preset.id)}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="sovereign-calculator-grid">
        <div className="sovereign-calc-card cloud-tax-card">
          <span className="calc-card-kicker">5-Year Recurring Cloud Office Spend ({activePreset.label})</span>
          <strong className="calc-card-figure">{formatUsd(activePreset.fiveYearCloudSpendUsd)}</strong>
          <p>{activePreset.cloudPlanDescription}</p>
        </div>

        <div className="sovereign-calc-card folio-local-card">
          <span className="calc-card-kicker">
            <HardDrive size={13} /> Folio Office ($0/mo Recurring · 100% Local on Your Machine)
          </span>
          <strong className="calc-card-figure">{formatUsd(activePreset.fiveYearFolioSpendUsd)} / 5 yrs</strong>
          <p>Full documents, spreadsheets, presentations, and notebooks stored directly on your device.</p>
        </div>

        <div className="sovereign-calc-card net-savings-card">
          <span className="calc-card-kicker">
            <ShieldCheck size={13} /> 5-Year Capital Retained In-House
          </span>
          <strong className="calc-card-figure">{formatUsd(activePreset.fiveYearNetSavingsUsd)} Retained</strong>
          <p>{activePreset.sovereigntyNote}</p>
        </div>
      </div>

      <div
        className="sovereign-privacy-comparator"
        data-testid="ownership-model-switcher"
        aria-label="One-Time Offline Desktop Ownership vs Monthly Cloud Subscription Switcher"
      >
        <div className="sovereign-calculator-header">
          <div>
            <span className="workspace-eyebrow">
              <HardDrive size={12} /> DUAL COMMERCIAL OWNERSHIP · ONE-TIME OFFLINE DESKTOP OR MONTHLY CLOUD
            </span>
            <h3>Choose One-Time Offline Desktop Ownership ($0/mo Forever) or Monthly Cloud Subscription.</h3>
          </div>
          <div
            className="sovereign-calculator-presets"
            role="tablist"
            aria-label="Ownership model options"
          >
            {FOLIO_OWNERSHIP_MODEL_OPTIONS.map((option) => {
              const selected = option.id === activeOwnershipModel.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  data-testid={`ownership-model-tab-${option.id}`}
                  className={selected ? 'selected' : ''}
                  onClick={() => setSelectedOwnershipModelId(option.id)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="sovereign-calculator-grid">
          <div className="sovereign-calc-card folio-local-card">
            <span className="calc-card-kicker">{activeOwnershipModel.priceBadge}</span>
            <strong className="calc-card-figure">{activeOwnershipModel.label}</strong>
            <p>{activeOwnershipModel.headline}</p>
          </div>

          <div className="sovereign-calc-card folio-local-card">
            <span className="calc-card-kicker">
              <Cpu size={13} /> Local Open-Source AI & Deterministic Engine
            </span>
            <p>{activeOwnershipModel.aiEngineSummary}</p>
          </div>

          <div className="sovereign-calc-card net-savings-card">
            <span className="calc-card-kicker">
              <ShieldCheck size={13} /> Vault Custody & Fit
            </span>
            <p>{activeOwnershipModel.storageAndPrivacySummary}</p>
            <p>{activeOwnershipModel.bestForSummary}</p>
          </div>
        </div>
      </div>

      <div
        className="sovereign-privacy-comparator"
        data-testid="desktop-download-hub"
        aria-label="Offline Desktop Installer Download Hub"
      >
        <div className="sovereign-calculator-header">
          <div>
            <span className="workspace-eyebrow">
              <Download size={12} /> OFFLINE DESKTOP DOWNLOAD HUB · WINDOWS, MACOS & LINUX
            </span>
            <h3>Install the Shared-Brain Offline Desktop App on Windows, macOS, or Linux.</h3>
          </div>
        </div>

        <div className="sovereign-calculator-grid">
          {FOLIO_DESKTOP_INSTALLER_TARGETS.map((target) => (
            <div
              key={target.id}
              className="sovereign-calc-card folio-local-card"
              data-testid={`desktop-installer-card-${target.id}`}
            >
              <span className="calc-card-kicker">
                <Download size={13} /> {target.osLabel} · {target.formatBadge}
              </span>
              <strong className="calc-card-figure">{target.formatBadge}</strong>
              <p>{target.architectureNote}</p>
              <p className="sovereign-receipt-preview">
                {target.installerFilename} | {target.sha256Preview}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div
        className="sovereign-privacy-comparator"
        data-testid="local-llm-hardware-selector"
        aria-label="Free Open-Source Local LLM Hardware Selector"
      >
        <div className="sovereign-calculator-header">
          <div>
            <span className="workspace-eyebrow">
              <Cpu size={12} /> FREE OPEN-SOURCE LOCAL LLM HARDWARE SELECTOR · LOOPBACK 127.0.0.1:11434
            </span>
            <h3>Run unlimited free local open-source AI (Llama 3.2 / Qwen) on your own hardware at $0 token cost.</h3>
          </div>
          <div
            className="sovereign-calculator-presets"
            role="tablist"
            aria-label="Local LLM hardware tiers"
          >
            {FOLIO_LOCAL_LLM_HARDWARE_TIERS.map((tier) => {
              const selected = tier.id === activeHardwareTier.id;
              return (
                <button
                  key={tier.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  data-testid={`local-llm-tier-${tier.id}`}
                  className={selected ? 'selected' : ''}
                  onClick={() => setSelectedHardwareTierId(tier.id)}
                >
                  {tier.hardwareTier} ({tier.modelTag})
                </button>
              );
            })}
          </div>
        </div>

        <div className="sovereign-calculator-grid">
          <div className="sovereign-calc-card folio-local-card">
            <span className="calc-card-kicker">Recommended Open-Source Model</span>
            <strong className="calc-card-figure">{activeHardwareTier.modelTag}</strong>
            <p>
              Hardware Tier: {activeHardwareTier.hardwareTier} ({activeHardwareTier.vramBudget})
            </p>
          </div>

          <div className="sovereign-calc-card folio-local-card">
            <span className="calc-card-kicker">
              <ShieldCheck size={13} /> Deterministic Fact-Sheet Guardrail (&lt; 3 KB)
            </span>
            <p>{activeHardwareTier.recommendedUseCase}</p>
            <p className="sovereign-receipt-preview">
              Loopback Bridge: {activeHardwareTier.loopbackEndpoint} | API Token Cost: $0.00
            </p>
          </div>

          <div className="sovereign-calc-card net-savings-card">
            <span className="calc-card-kicker">
              <Cpu size={13} /> 1-Click Local Ollama Bootstrap
            </span>
            <p className="sovereign-receipt-preview">{activeHardwareTier.ollamaCommand}</p>
            <button
              type="button"
              data-testid="copy-local-ollama-cmd-btn"
              className="copy-sovereign-receipt-button"
              onClick={handleCopyOllamaCommand}
            >
              {copiedOllamaTierId === activeHardwareTier.id ? (
                <>
                  <Check size={14} /> Copied {activeHardwareTier.ollamaCommand}
                </>
              ) : (
                <>
                  <Copy size={14} /> 1-Click Copy {activeHardwareTier.ollamaCommand}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div
        className="sovereign-privacy-comparator"
        data-testid="offline-parity-table"
        aria-label="Offline Desktop vs Cloud Web 100% Feature Parity Table"
      >
        <div className="sovereign-calculator-header">
          <div>
            <span className="workspace-eyebrow">
              <Layers size={12} /> 100% SHARED-BRAIN PARITY · OFFLINE DESKTOP VS CLOUD WEB
            </span>
            <h3>Identical OOXML document, financial formula, and slide engine across Offline Desktop and Cloud Web.</h3>
          </div>
        </div>

        <div className="sovereign-calculator-grid">
          {FOLIO_OFFLINE_PARITY_ROWS.map((row) => (
            <div key={row.capability} className="sovereign-calc-card folio-local-card">
              <span className="calc-card-kicker">{row.capability}</span>
              <p>
                <strong>Offline Desktop:</strong> {row.offlineDesktopStatus}
              </p>
              <p>
                <strong>Cloud Web:</strong> {row.cloudWebStatus}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div
        className="sovereign-privacy-comparator"
        data-testid="folio-privacy-comparator"
        aria-label="3-Second Cloud Docs Telemetry vs Air-Gapped Local Vault Privacy Comparator"
      >
        <div className="sovereign-calculator-header">
          <div>
            <span className="workspace-eyebrow">
              <Lock size={12} /> 3-SECOND CLOUD DOCS TELEMETRY VS AIR-GAPPED LOCAL VAULT PRIVACY COMPARATOR
            </span>
            <h3>Keep confidential work off third-party cloud telemetry pipelines.</h3>
          </div>
          <div
            className="sovereign-calculator-presets"
            role="tablist"
            aria-label="Confidential document type presets"
          >
            {FOLIO_PRIVACY_COMPARATOR_PRESETS.map((docPreset) => {
              const selected = docPreset.id === activeDocPreset.id;
              return (
                <button
                  key={docPreset.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  data-testid={`folio-privacy-preset-${docPreset.id}`}
                  className={selected ? 'selected' : ''}
                  onClick={() => setSelectedDocPresetId(docPreset.id)}
                >
                  {docPreset.documentType}
                </button>
              );
            })}
          </div>
        </div>

        <div className="sovereign-calculator-grid">
          <div className="sovereign-calc-card cloud-tax-card">
            <span className="calc-card-kicker">Cloud Docs Telemetry Exposure</span>
            <p>{activeDocPreset.cloudTelemetryExposure}</p>
            <p>{activeDocPreset.cloudRetentionRisk}</p>
          </div>

          <div className="sovereign-calc-card folio-local-card">
            <span className="calc-card-kicker">
              <HardDrive size={13} /> Air-Gapped Local Vault Guarantee
            </span>
            <p>{activeDocPreset.localVaultGuarantee}</p>
          </div>

          <div className="sovereign-calc-card net-savings-card">
            <span className="calc-card-kicker">
              <ShieldCheck size={13} /> Sovereign Office Verification Receipt
            </span>
            <p className="sovereign-receipt-preview">{activeDocPreset.verificationReceiptText}</p>
            <button
              type="button"
              data-testid="copy-sovereign-office-receipt-btn"
              className="copy-sovereign-receipt-button"
              onClick={handleCopyReceipt}
            >
              {copiedDocPresetId === activeDocPreset.id ? (
                <>
                  <Check size={14} /> Copied Sovereign Office Verification Receipt
                </>
              ) : (
                <>
                  <Copy size={14} /> 1-Click Copy Sovereign Office Verification Receipt
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div
        className="sovereign-privacy-comparator"
        data-testid="folio-export-verifier"
        aria-label="3-Second Multi-Format Sovereign Export and Formula Audit Verifier"
      >
        <div className="sovereign-calculator-header">
          <div>
            <span className="workspace-eyebrow">
              <FileCheck2 size={12} /> 3-SECOND MULTI-FORMAT SOVEREIGN EXPORT & FORMULA AUDIT VERIFIER
            </span>
            <h3>Verify zero formula errors and local SHA-256 export integrity before sending to clients.</h3>
          </div>
          <div
            className="sovereign-calculator-presets"
            role="tablist"
            aria-label="Sovereign export verifier presets"
          >
            {FOLIO_EXPORT_VERIFIER_PRESETS.map((exportPreset) => {
              const selected = exportPreset.id === activeExportPreset.id;
              return (
                <button
                  key={exportPreset.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  data-testid={`folio-export-preset-${exportPreset.id}`}
                  className={selected ? 'selected' : ''}
                  onClick={() => setSelectedExportPresetId(exportPreset.id)}
                >
                  {exportPreset.deliverableLabel}
                </button>
              );
            })}
          </div>
        </div>

        <div className="sovereign-calculator-grid">
          <div className="sovereign-calc-card folio-local-card">
            <span className="calc-card-kicker">Local OOXML Package Format</span>
            <p>{activeExportPreset.ooxmlFormatSummary}</p>
          </div>

          <div className="sovereign-calc-card folio-local-card">
            <span className="calc-card-kicker">
              <ShieldCheck size={13} /> Deterministic Formula & Schema Audit
            </span>
            <p>{activeExportPreset.formulaAndSchemaAudit}</p>
            <p className="sovereign-receipt-preview">{activeExportPreset.localSha256Digest}</p>
          </div>

          <div className="sovereign-calc-card net-savings-card">
            <span className="calc-card-kicker">
              <FileCheck2 size={13} /> Client Deliverable Manifest
            </span>
            <p className="sovereign-receipt-preview">{activeExportPreset.manifestText}</p>
            <button
              type="button"
              data-testid="copy-deliverable-manifest-btn"
              className="copy-sovereign-receipt-button"
              onClick={handleCopyManifest}
            >
              {copiedExportPresetId === activeExportPreset.id ? (
                <>
                  <Check size={14} /> Copied Deliverable Manifest
                </>
              ) : (
                <>
                  <Copy size={14} /> 1-Click Copy Client Deliverable Manifest
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
