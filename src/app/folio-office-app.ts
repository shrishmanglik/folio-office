import {
  FOLIO_PRIVACY_COMPARATOR_PRESETS,
  renderFolioPrivacyComparatorShell,
  type ConfidentialDocPrivacyPreset,
} from '../ui/shell-template';

export { FOLIO_PRIVACY_COMPARATOR_PRESETS, renderFolioPrivacyComparatorShell, type ConfidentialDocPrivacyPreset };

export const FOLIO_PRIVACY_COMPARATOR_TEST_ID = 'folio-privacy-comparator';
export const COPY_SOVEREIGN_OFFICE_RECEIPT_BTN_TEST_ID = 'copy-sovereign-office-receipt-btn';

export function getFolioPrivacyPresetById(presetId: string): ConfidentialDocPrivacyPreset {
  return (
    FOLIO_PRIVACY_COMPARATOR_PRESETS.find((preset) => preset.id === presetId) ??
    FOLIO_PRIVACY_COMPARATOR_PRESETS[0]
  );
}

export function buildSovereignOfficeVerificationReceipt(presetId: string): string {
  const preset = getFolioPrivacyPresetById(presetId);
  return preset.verificationReceiptText;
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
