import { useState } from 'react';
import {
  ShieldCheck,
  HardDrive,
  Calculator,
  Lock,
  Copy,
  Check,
  FileCheck2,
} from 'lucide-react';
import {
  FOLIO_PRIVACY_COMPARATOR_PRESETS,
  FOLIO_EXPORT_VERIFIER_PRESETS,
  FOLIO_OWNERSHIP_MODEL_OPTIONS,
  FOLIO_LOCAL_LLM_HARDWARE_TIERS,
  FOLIO_OFFLINE_PARITY_ROWS,
  copySovereignOfficeVerificationReceipt,
  copyClientDeliverableManifest,
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

      <div className="ownership-surface">
        <div className="ownership-heading">
          <div>
            <span className="workspace-eyebrow">
              <HardDrive size={12} /> OWN YOUR LOCAL WORKFLOW
            </span>
            <h2>Choose where Folio Office runs.</h2>
          </div>
          <div
            className="sovereign-calculator-presets"
            data-testid="ownership-model-switcher"
            role="group"
            aria-label="Ownership model options"
          >
            {FOLIO_OWNERSHIP_MODEL_OPTIONS.map((option) => {
              const selected = option.id === activeOwnershipModel.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={selectedOwnershipModelId === option.id}
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

        <p className="ownership-model-copy" aria-live="polite">{activeOwnershipModel.headline}</p>

        <div className="sovereign-calculator-grid">
          <div className="sovereign-calc-card folio-local-card">
            <span className="calc-card-kicker">{activeOwnershipModel.priceBadge}</span>
            <strong className="calc-card-figure">{activeOwnershipModel.label}</strong>
            <p>{activeOwnershipModel.headline}</p>
          </div>

          <div className="sovereign-calc-card folio-local-card">
            <span className="calc-card-kicker">
              <HardDrive size={13} /> Local AI and deterministic engine
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

      <article
        className="desktop-download-hub"
        data-testid="desktop-download-hub"
        data-release-status="in-preparation"
      >
        <span className="ownership-state">IN PREPARATION</span>
        <h3>Signed desktop ownership release</h3>
        <p>Folio Office currently has Electron desktop source. The Tauri v2 installer signing and offline license key ring are pending.</p>
        <p>No customer download is published from this source contract.</p>
      </article>

      <article className="local-llm-card" aria-label="Free Open-Source Local LLM Hardware Selector">
        <div className="sovereign-calculator-header">
          <div>
            <span className="workspace-eyebrow">
              <HardDrive size={12} /> LOCAL AI HARDWARE GUIDANCE · LOOPBACK 127.0.0.1:11434
            </span>
            <h3>Choose a proposed local model for the buyer computer.</h3>
          </div>
          <select
            data-testid="local-llm-hardware-selector"
            aria-label="Computer memory guidance"
            value={selectedHardwareTierId}
            onChange={(event) => setSelectedHardwareTierId(event.target.value)}
          >
            {FOLIO_LOCAL_LLM_HARDWARE_TIERS.map((tier) => <option key={tier.id} value={tier.id}>{tier.hardwareTier}</option>)}
          </select>
        </div>

        <div className="sovereign-calculator-grid">
          <div className="sovereign-calc-card folio-local-card">
            <span className="calc-card-kicker">Recommended Open-Source Model</span>
            <strong className="calc-card-figure">{activeHardwareTier.modelTag}</strong>
            <p>
              Hardware tier: {activeHardwareTier.hardwareTier}
            </p>
          </div>

          <div className="sovereign-calc-card folio-local-card">
            <span className="calc-card-kicker">
              <ShieldCheck size={13} /> Deterministic Fact-Sheet Guardrail (&lt; 3 KB)
            </span>
            <p>{activeHardwareTier.recommendedUseCase}</p>
            <p className="sovereign-receipt-preview">
              Loopback: {activeHardwareTier.loopbackEndpoint} | Studio server and API cost: $0.00 / 1,000 runs
            </p>
          </div>

          <div className="sovereign-calc-card net-savings-card">
            <span className="calc-card-kicker">
              <HardDrive size={13} /> Exact local Ollama command
            </span>
            <p className="sovereign-receipt-preview">{activeHardwareTier.ollamaCommands.map((command) => <code key={command}>{command}</code>)}</p>
          </div>
        </div>
        <p className="ownership-note">The proposed local AI adapter is not shipped in the current Electron build. The $0.00 figure covers studio server and API-token costs only. The buyer provides hardware, electricity, model downloads, and storage. Hardware tiers are guidance, not a performance guarantee.</p>
      </article>

      <div
        className="offline-parity-wrap"
        tabIndex={0}
        role="region"
        aria-label="Offline and cloud capability comparison"
      >
        <div className="sovereign-calculator-header">
          <div>
            <span className="workspace-eyebrow">
              <HardDrive size={12} /> OFFLINE AND CLOUD CAPABILITY COMPARISON
            </span>
            <h3>See what stays local and what needs the proposed hosted plan.</h3>
          </div>
        </div>

        <table data-testid="offline-parity-table">
          <caption>Proposed desktop and local AI capabilities compared with the proposed hosted subscription model</caption>
          <thead><tr><th scope="col">Workflow</th><th scope="col">On this computer · No monthly limit</th><th scope="col">Online plan allowance</th><th scope="col">Needs the internet</th></tr></thead>
          <tbody>{FOLIO_OFFLINE_PARITY_ROWS.map((row) => <tr key={row.capability}><th scope="row">{row.capability}</th><td>{row.offlineDesktopStatus}</td><td>{row.cloudWebStatus}</td><td>{row.needsInternet}</td></tr>)}</tbody>
        </table>
      </div>

      <p className="ownership-note">One-time license pricing and terms are not published. The five-year comparison on this page covers recurring subscriptions only. It excludes any future one-time license price and the buyer&apos;s hardware and electricity costs.</p>
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
