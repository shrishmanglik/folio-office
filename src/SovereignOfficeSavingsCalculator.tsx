import { useState } from 'react';
import { ShieldCheck, HardDrive, Calculator, Lock, Copy, Check } from 'lucide-react';
import {
  FOLIO_PRIVACY_COMPARATOR_PRESETS,
  copySovereignOfficeVerificationReceipt,
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

  const activePreset =
    SOVEREIGN_OFFICE_SEAT_PRESETS.find((preset) => preset.id === selectedId) ??
    SOVEREIGN_OFFICE_SEAT_PRESETS[0];

  const activeDocPreset =
    FOLIO_PRIVACY_COMPARATOR_PRESETS.find((preset) => preset.id === selectedDocPresetId) ??
    FOLIO_PRIVACY_COMPARATOR_PRESETS[0];

  const handleCopyReceipt = async () => {
    await copySovereignOfficeVerificationReceipt(activeDocPreset.id);
    setCopiedDocPresetId(activeDocPreset.id);
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
    </section>
  );
}
