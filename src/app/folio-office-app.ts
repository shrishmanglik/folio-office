import {
  FOLIO_PRIVACY_COMPARATOR_PRESETS,
  FOLIO_EXPORT_VERIFIER_PRESETS,
  renderFolioPrivacyComparatorShell,
  renderFolioExportVerifierShell,
  type ConfidentialDocPrivacyPreset,
  type SovereignExportVerifierPreset,
} from '../ui/shell-template';

export {
  FOLIO_PRIVACY_COMPARATOR_PRESETS,
  FOLIO_EXPORT_VERIFIER_PRESETS,
  renderFolioPrivacyComparatorShell,
  renderFolioExportVerifierShell,
  type ConfidentialDocPrivacyPreset,
  type SovereignExportVerifierPreset,
};

export const FOLIO_PRIVACY_COMPARATOR_TEST_ID = 'folio-privacy-comparator';
export const COPY_SOVEREIGN_OFFICE_RECEIPT_BTN_TEST_ID = 'copy-sovereign-office-receipt-btn';
export const FOLIO_EXPORT_VERIFIER_TEST_ID = 'folio-export-verifier';
export const COPY_DELIVERABLE_MANIFEST_BTN_TEST_ID = 'copy-deliverable-manifest-btn';

export function getFolioPrivacyPresetById(presetId: string): ConfidentialDocPrivacyPreset {
  return (
    FOLIO_PRIVACY_COMPARATOR_PRESETS.find((preset) => preset.id === presetId) ??
    FOLIO_PRIVACY_COMPARATOR_PRESETS[0]
  );
}

export function getFolioExportVerifierPresetById(presetId: string): SovereignExportVerifierPreset {
  return (
    FOLIO_EXPORT_VERIFIER_PRESETS.find((preset) => preset.id === presetId) ??
    FOLIO_EXPORT_VERIFIER_PRESETS[0]
  );
}

export function buildSovereignOfficeVerificationReceipt(presetId: string): string {
  const preset = getFolioPrivacyPresetById(presetId);
  return preset.verificationReceiptText;
}

export function buildClientDeliverableManifest(presetId: string): string {
  const preset = getFolioExportVerifierPresetById(presetId);
  return preset.manifestText;
}

export async function copySovereignOfficeVerificationReceipt(presetId: string): Promise<string> {
  const receipt = buildSovereignOfficeVerificationReceipt(presetId);
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(receipt);
    }
  } catch {
    // Keep clipboard copy non-blocking in offline/headless environments
  }
  return receipt;
}

export async function copyClientDeliverableManifest(presetId: string): Promise<string> {
  const manifest = buildClientDeliverableManifest(presetId);
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(manifest);
    }
  } catch {
    // Keep clipboard copy non-blocking in offline/headless environments
  }
  return manifest;
}
