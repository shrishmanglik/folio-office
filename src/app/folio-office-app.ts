import {
  FOLIO_PRIVACY_COMPARATOR_PRESETS,
  FOLIO_EXPORT_VERIFIER_PRESETS,
  FOLIO_OWNERSHIP_MODEL_OPTIONS,
  FOLIO_DESKTOP_INSTALLER_TARGETS,
  FOLIO_LOCAL_LLM_HARDWARE_TIERS,
  FOLIO_OFFLINE_PARITY_ROWS,
  renderFolioPrivacyComparatorShell,
  renderFolioExportVerifierShell,
  renderFolioOwnershipHubShell,
  type ConfidentialDocPrivacyPreset,
  type SovereignExportVerifierPreset,
  type FolioOwnershipModelOption,
  type FolioDesktopInstallerTarget,
  type FolioLocalLlmHardwareTier,
  type FolioOfflineParityRow,
} from '../ui/shell-template';
export {default as FolioSovereignCommandSuite,FOLIO_NATIVE_PRESETS,FOLIO_COMMAND_WORKSPACES,calculateFolioPresetResult,getFolioSpreadsheetFormula,formatFolioPresetResult,buildFolioPresetReceipt,buildFolioNativeArtifact,type FolioNativePreset,type FolioCommandWorkspace} from '../FolioSovereignCommandSuite';

export {
  FOLIO_PRIVACY_COMPARATOR_PRESETS,
  FOLIO_EXPORT_VERIFIER_PRESETS,
  FOLIO_OWNERSHIP_MODEL_OPTIONS,
  FOLIO_DESKTOP_INSTALLER_TARGETS,
  FOLIO_LOCAL_LLM_HARDWARE_TIERS,
  FOLIO_OFFLINE_PARITY_ROWS,
  renderFolioPrivacyComparatorShell,
  renderFolioExportVerifierShell,
  renderFolioOwnershipHubShell,
  type ConfidentialDocPrivacyPreset,
  type SovereignExportVerifierPreset,
  type FolioOwnershipModelOption,
  type FolioDesktopInstallerTarget,
  type FolioLocalLlmHardwareTier,
  type FolioOfflineParityRow,
};

export const FOLIO_PRIVACY_COMPARATOR_TEST_ID = 'folio-privacy-comparator';
export const COPY_SOVEREIGN_OFFICE_RECEIPT_BTN_TEST_ID = 'copy-sovereign-office-receipt-btn';
export const FOLIO_EXPORT_VERIFIER_TEST_ID = 'folio-export-verifier';
export const COPY_DELIVERABLE_MANIFEST_BTN_TEST_ID = 'copy-deliverable-manifest-btn';
export const OWNERSHIP_MODEL_SWITCHER_TEST_ID = 'ownership-model-switcher';
export const DESKTOP_DOWNLOAD_HUB_TEST_ID = 'desktop-download-hub';
export const LOCAL_LLM_HARDWARE_SELECTOR_TEST_ID = 'local-llm-hardware-selector';
export const OFFLINE_PARITY_TABLE_TEST_ID = 'offline-parity-table';

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

export function getFolioLocalLlmHardwareTierById(tierId: string): FolioLocalLlmHardwareTier {
  return (
    FOLIO_LOCAL_LLM_HARDWARE_TIERS.find((tier) => tier.id === tierId) ??
    FOLIO_LOCAL_LLM_HARDWARE_TIERS[1]
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

export async function copyLocalOllamaBootstrapCommand(tierId: string): Promise<string> {
  const tier = getFolioLocalLlmHardwareTierById(tierId);
  const command = tier.ollamaCommands.join('\n');
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(command);
    }
  } catch {
    // Keep clipboard copy non-blocking in offline/headless environments
  }
  return command;
}
